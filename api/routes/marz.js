import { Router } from 'express'
import axios from 'axios'
import crypto from 'crypto'
import { marzConfig, getMarzAuthHeaders, formatPhone } from '../lib/marz.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const marzRouter = Router()

const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

const normalizeProvider = (p) => {
  const s = String(p).toLowerCase()
  if (s.includes('mtn')) return 'mtn_momo'
  if (s.includes('airtel')) return 'airtel_money'
  return p
}

async function ensureProfileExists(userId) {
  if (!isValidUuid(userId)) return null
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (existing) return existing

  const fallbackProfile = {
    id: userId,
    email: `user-${userId.slice(0, 8)}@fallback.local`,
    full_name: '',
    username: `user_${userId.slice(0, 8)}`,
    role: 'user',
    balance: 0,
    kyc_verified: false,
    status: 'active',
    referral_code: `PRIME-${userId.slice(0, 8)}`,
    referred_by: null,
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .insert(fallbackProfile)

  if (error) {
    console.error('[MARZ] failed to create fallback profile:', error.message || error)
    return null
  }

  return fallbackProfile
}

// ---------------------------------------------------------------------------
// POST /api/marz/collect-money  — Deposit (collect from user's MoMo/Airtel)
// ---------------------------------------------------------------------------
marzRouter.post('/collect-money', async (req, res) => {
  try {
    const { amount, phone, provider, reference, user_id } = req.body

    if (!amount || !phone || !provider) {
      return res.status(400).json({ message: 'amount, phone and provider are required' })
    }

    const ugxAmount = Math.round(parseFloat(amount))
    const reference_ = isValidUuid(reference) ? reference : crypto.randomUUID()

    const payload = {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: formatPhone(phone),
      provider: normalizeProvider(provider),
      reference: reference_,
      callback_url: marzConfig.callbackUrl,
      user_id,
    }

    const response = await axios.post(`${marzConfig.baseUrl}/collect-money`, payload, {
      headers: getMarzAuthHeaders(),
    })

    const isSandbox = Boolean(response.data?.data?.sandbox_mode || response.data?.sandbox_mode)

    if (user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)) {
      await ensureProfileExists(user_id)
      const { error: txError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id,
          type: 'deposit',
          amount: ugxAmount,
          status: 'pending',
          provider: normalizeProvider(provider),
          reference: reference_,
        })
      if (txError) console.error('[MARZ] failed to create pending deposit tx:', txError.message || txError)
    } else {
      console.warn('[MARZ] skipped creating pending deposit tx because user_id is missing or invalid:', user_id)
    }

    return res.status(200).json({
      status: 'initiated',
      message: isSandbox 
        ? 'Sandbox collection simulated. Switch Marz Innovations dashboard to Live Mode to send physical USSD prompts.'
        : 'USSD PIN confirmation prompt sent to user phone',
      data: response.data,
      reference: reference_,
      is_sandbox: isSandbox,
      transaction: response.data?.data?.transaction || null,
      ugxAmount,
    })
  } catch (error) {
    const errData = error.response?.data || {}
    console.error('[MARZ] collect-money error', {
      message: errData.message || error.message,
      status: error.response?.status,
      baseUrl: marzConfig.baseUrl,
      apiKeyPrefix: marzConfig.apiKey ? marzConfig.apiKey.slice(0, 6) + '...' : 'MISSING',
      apiSecretPrefix: marzConfig.apiSecret ? marzConfig.apiSecret.slice(0, 6) + '...' : 'MISSING',
      callbackUrl: marzConfig.callbackUrl,
      fullError: errData,
    })

    return res.status(500).json({
      message: errData.message || 'Failed to initiate payment',
      details: errData,
    })
  }
})

// ---------------------------------------------------------------------------
// POST /api/marz/disburse  — Withdrawal (send to user's MoMo/Airtel)
// ---------------------------------------------------------------------------
marzRouter.post('/disburse', async (req, res) => {
  try {
    const { amount, phone, provider, reference, user_id } = req.body

    if (!amount || !phone || !provider) {
      return res.status(400).json({ message: 'amount, phone and provider are required' })
    }

    const ugxAmount = Math.round(parseFloat(amount))

    if (ugxAmount < 10000) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is UGX 10,000' })
    }

    const reference_ = isValidUuid(reference) ? reference : crypto.randomUUID()

    const payload = {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: formatPhone(phone),
      provider: normalizeProvider(provider),
      reference: reference_,
      callback_url: marzConfig.callbackUrl,
      user_id,
    }

    const response = await axios.post(`${marzConfig.baseUrl}/send-money`, payload, {
      headers: getMarzAuthHeaders(),
    })

    if (user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)) {
      await ensureProfileExists(user_id)
      const { error: txError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id,
          type: 'withdrawal',
          amount: ugxAmount,
          status: 'pending',
          provider: normalizeProvider(provider),
          reference: reference_,
        })
      if (txError) console.error('[MARZ] failed to create pending withdrawal tx:', txError.message || txError)
    } else {
      console.warn('[MARZ] skipped creating pending withdrawal tx because user_id is missing or invalid:', user_id)
    }

    return res.status(200).json({
      status: 'initiated',
      data: response.data,
      reference: reference_,
      ugxAmount,
    })
  } catch (error) {
    const errData = error.response?.data || {}
    console.error('[MARZ] disburse error', errData || error.message)

    let message = errData.message || 'Failed to initiate withdrawal'
    if (errData.error_code === 'IP_WHITELIST_REQUIRED') {
      message = 'Disbursement requires server IP whitelisting on Marz Innovations Dashboard. Please contact support or whitelist server IP.'
    }

    return res.status(500).json({
      message,
      details: errData,
    })
  }
})

// ---------------------------------------------------------------------------
// POST /api/marz/sync  — automatic sync pending deposits/withdrawals with Marz
// ---------------------------------------------------------------------------
marzRouter.post('/sync', async (req, res) => {
  try {
    const { data: pendingDeposits } = await supabaseAdmin
      .from('transactions')
      .select('id, reference, amount, user_id, type')
      .eq('type', 'deposit')
      .in('status', ['pending', 'pending_approval'])

    const { data: pendingWithdrawals } = await supabaseAdmin
      .from('transactions')
      .select('id, reference, amount, user_id, type')
      .eq('type', 'withdrawal')
      .eq('status', 'pending')

    const allPending = [...(pendingDeposits || []), ...(pendingWithdrawals || [])]

    if (allPending.length === 0) {
      return res.status(200).json({ synced: 0, message: 'No pending transactions to sync' })
    }

    let synced = 0
    for (const tx of allPending) {
      if (!tx.reference) continue
      try {
        const statusRes = await fetch(`${marzConfig.baseUrl}/transaction/${encodeURIComponent(tx.reference)}`, {
          headers: getMarzAuthHeaders(),
        })
        if (!statusRes.ok) {
          if (statusRes.status === 404) {
            continue
          }
          continue
        }
        const statusData = await statusRes.json()
        const status = String(statusData.status || statusData.data?.status || '').toLowerCase()

        if (tx.type === 'deposit') {
          if (['completed', 'success', 'paid', 'credited', 'successful'].includes(status)) {
            await supabaseAdmin.from('transactions').update({ status: 'pending_approval' }).eq('id', tx.id)
            synced++
          } else if (['failed', 'rejected', 'cancelled', 'expired'].includes(status)) {
            await supabaseAdmin.from('transactions').update({ status: 'rejected' }).eq('id', tx.id)
            synced++
          }
        } else if (tx.type === 'withdrawal') {
          if (['completed', 'success', 'paid', 'credited', 'successful'].includes(status)) {
            await supabaseAdmin.from('transactions').update({ status: 'completed' }).eq('id', tx.id)
            synced++
          } else if (['failed', 'rejected', 'cancelled', 'expired'].includes(status)) {
            await supabaseAdmin.from('transactions').update({ status: 'rejected' }).eq('id', tx.id)
            synced++
          }
        }
      } catch (err) {
        console.error('[MARZ] sync error for reference', tx.reference, err)
      }
    }

    res.status(200).json({ synced, total: allPending.length })
  } catch (error) {
    console.error('[MARZ] sync error', error.message)
    res.status(500).json({ message: 'Sync failed', details: error.message })
  }
})

// ---------------------------------------------------------------------------
// GET /api/marz/health  — diagnostic + Marz credentials check
// ---------------------------------------------------------------------------
marzRouter.get('/health', async (req, res) => {
  try {
    const response = await axios.post(`${marzConfig.baseUrl}/collect-money`, {
      amount: 100,
      currency: 'UGX',
      country: 'UG',
      phone_number: '+256781969741',
      provider: 'mtn_momo',
      reference: 'HEALTH-CHECK-' + Date.now(),
      callback_url: marzConfig.callbackUrl,
      user_id: 'health-check',
    }, { headers: getMarzAuthHeaders() })

    return res.status(200).json({
      status: 'ok',
      message: 'Marz credentials are valid',
      marz: response.data,
    })
  } catch (error) {
    const errData = error.response?.data || {}
    console.error('[MARZ] health check error', errData || error.message)
    return res.status(200).json({
      status: 'error',
      message: errData.message || 'Marz credentials check failed',
      baseUrl: marzConfig.baseUrl,
      apiKeyPrefix: marzConfig.apiKey ? marzConfig.apiKey.slice(0, 6) + '...' : 'MISSING',
      apiSecretPrefix: marzConfig.apiSecret ? marzConfig.apiSecret.slice(0, 6) + '...' : 'MISSING',
      details: errData,
    })
  }
})
marzRouter.get('/transaction/:reference', async (req, res) => {
  try {
    const { reference } = req.params
    const response = await axios.get(
      `${marzConfig.baseUrl}/transaction/${encodeURIComponent(reference)}`,
      { headers: getMarzAuthHeaders() }
    )
    return res.status(200).json(response.data)
  } catch (error) {
    console.error('[MARZ] transaction status error', error.response?.data || error.message)
    return res.status(500).json({
      message: 'Failed to fetch transaction status',
      details: error.response?.data || error.message,
    })
  }
})

// ---------------------------------------------------------------------------
// POST /api/marz/webhook  — Marz Innovations payment callback
// ---------------------------------------------------------------------------
marzRouter.post(['/webhook', '/'], async (req, res) => {
  try {
    const signature = req.headers['x-marz-signature'] || ''

    const rawBody = req.rawBody
    if (!rawBody) {
      console.error('[MARZ] rawBody missing — middleware not configured correctly')
      return res.status(500).json({ message: 'Server misconfiguration: rawBody unavailable' })
    }

    const expected = crypto
      .createHmac('sha256', marzConfig.webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (signature !== expected) {
      console.warn('[MARZ] invalid webhook signature')
      return res.status(401).json({ message: 'Invalid signature' })
    }

    const event = req.body
    console.log('[MARZ] webhook event received', event.reference || event.transaction_id, '| status:', event.status)

    const reference = event.reference || event.transaction_id
    const status = (event.status || '').toLowerCase()
    const isSuccess = status === 'success' || status === 'completed' || status === 'approved'
    const isFailed = status === 'failed' || status === 'cancelled' || status === 'rejected'
    const userId = event.user_id || event.customer_id || null

    if (!reference) {
      return res.status(200).json({ received: true, note: 'no reference in payload' })
    }

    if (isSuccess || isFailed) {
      const { data: existingTx } = await supabaseAdmin
        .from('transactions')
        .select('id, status, type, amount, user_id')
        .eq('reference', reference)
        .single()

      if (existingTx) {
        if (existingTx.type === 'deposit') {
          const newStatus = isSuccess ? 'pending_approval' : 'rejected'
          if (existingTx.status !== newStatus) {
            await supabaseAdmin
              .from('transactions')
              .update({ status: newStatus })
              .eq('id', existingTx.id)
          }
        } else if (existingTx.type === 'withdrawal') {
          const newStatus = isSuccess ? 'completed' : 'rejected'
          if (existingTx.status !== newStatus) {
            await supabaseAdmin
              .from('transactions')
              .update({ status: newStatus })
              .eq('id', existingTx.id)
          }
        }
      } else if (isSuccess && userId) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()

        if (profile) {
          const txType = event.direction === 'payout' || event.type === 'send-money' ? 'withdrawal' : 'deposit'
          const amount = event.amount ? parseFloat(event.amount) : 0

          await supabaseAdmin.from('transactions').insert({
            user_id: userId,
            type: txType,
            amount,
            status: txType === 'deposit' ? 'pending_approval' : 'completed',
            provider: event.provider || event.channel || null,
            reference,
          })

          if (txType === 'deposit') {
            // Do NOT increment balance here; admin must approve first
          }
        }
      }
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[MARZ] webhook error', error.message)
    return res.status(500).json({ message: 'Webhook processing failed' })
  }
})
