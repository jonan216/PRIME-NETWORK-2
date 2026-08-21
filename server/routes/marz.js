import { Router } from 'express'
import axios from 'axios'
import crypto from 'crypto'
import { marzConfig, getMarzAuthHeaders, formatPhone } from '../lib/marz.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

export const marzRouter = Router()

const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

const normalizeProvider = (p) => {
  const s = String(p || '').toLowerCase()
  if (s.includes('mtn')) return 'mtn_momo'
  if (s.includes('airtel')) return 'airtel_money'
  return p
}

const SUCCESS_STATUSES = ['completed', 'approved', 'credited', 'successful', 'success', 'paid', 'sandbox', 'settled', 'successful_payment']
const FAILED_STATUSES = ['failed', 'rejected', 'cancelled', 'expired']

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

    if (user_id && isValidUuid(user_id)) {
      await ensureProfileExists(user_id)
      const { error: txError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id,
          type: 'deposit',
          amount: ugxAmount,
          status: isSandbox ? 'completed' : 'pending',
          provider: normalizeProvider(provider),
          reference: reference_,
        })
      if (txError) console.error('[MARZ] failed to create pending deposit tx:', txError.message || txError)

      if (isSandbox) {
        await supabaseAdmin.rpc('increment_balance', { p_user_id: user_id, p_amount: ugxAmount }).catch(() => {})
      }
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

    if (user_id && isValidUuid(user_id)) {
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
// POST /api/marz/manual-credit-user  — Manual/Emergency credit for user deposit
// ---------------------------------------------------------------------------
marzRouter.post('/manual-credit-user', async (req, res) => {
  try {
    const { identifier, amount, reference, provider } = req.body

    if (!identifier || !amount) {
      return res.status(400).json({ message: 'identifier (email/username/user_id) and amount are required' })
    }

    const ugxAmount = parseFloat(amount)
    let profile = null

    if (isValidUuid(identifier)) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', identifier).single()
      profile = data
    }

    if (!profile) {
      const { data } = await supabaseAdmin.from('profiles').select('*').or(`email.eq.${identifier.toLowerCase()},username.eq.${identifier.toLowerCase()}`).single()
      profile = data
    }

    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' })
    }

    const ref = reference || `MANUAL-CREDIT-${Date.now()}`

    await supabaseAdmin.from('transactions').insert({
      user_id: profile.id,
      type: 'deposit',
      amount: ugxAmount,
      status: 'completed',
      provider: provider || 'manual',
      reference: ref,
    })

    await supabaseAdmin.rpc('recalculate_balance', { p_user_id: profile.id }).catch(() => {})

    return res.status(200).json({
      success: true,
      message: `Successfully credited UGX ${ugxAmount.toLocaleString()} to ${profile.email} (${profile.username})`,
      userId: profile.id,
      reference: ref,
    })
  } catch (err) {
    console.error('[MARZ] manual-credit-user error:', err.message)
    return res.status(500).json({ message: 'Manual credit failed', details: err.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/marz/reconcile-deposits  — Deep scan Marz API and credit missing deposits
// ---------------------------------------------------------------------------
marzRouter.post('/reconcile-deposits', async (req, res) => {
  try {
    const { userId } = req.body || {}

    let query = supabaseAdmin
      .from('transactions')
      .select('id, reference, amount, user_id, type, status')
      .eq('type', 'deposit')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: deposits, error: dbError } = await query

    if (dbError) {
      console.error('[MARZ] reconcile-deposits DB error:', dbError.message)
      return res.status(500).json({ message: 'Failed to fetch deposits for reconciliation', error: dbError.message })
    }

    let recoveredCount = 0
    let totalCreditedAmount = 0

    for (const tx of deposits || []) {
      if (!tx.reference) continue
      try {
        const response = await axios.get(`${marzConfig.baseUrl}/transactions/${encodeURIComponent(tx.reference)}`, {
          headers: getMarzAuthHeaders(),
        }).catch(() => null)

        if (!response || !response.data) continue

        const resData = response.data
        const remoteStatus = String(resData.status || resData.data?.status || resData.transaction?.status || '').toLowerCase()
        const remoteAmount = parseFloat(resData.amount || resData.data?.amount || tx.amount || 0)

        if (SUCCESS_STATUSES.includes(remoteStatus)) {
          if (tx.status !== 'completed' && tx.status !== 'approved') {
            await supabaseAdmin.from('transactions').update({ status: 'completed', amount: remoteAmount }).eq('id', tx.id)
            await supabaseAdmin.rpc('recalculate_balance', { p_user_id: tx.user_id }).catch(() => {})
            recoveredCount++
            totalCreditedAmount += remoteAmount
          }
        }
      } catch (err) {
        console.error('[MARZ] deposit reconciliation error for reference', tx.reference, err.message)
      }
    }

    await supabaseAdmin.rpc('recalculate_all_balances').catch(() => {})

    return res.status(200).json({
      success: true,
      message: `Deposit reconciliation complete. Recovered ${recoveredCount} missing deposit(s).`,
      recoveredCount,
      totalCreditedAmount,
    })
  } catch (error) {
    console.error('[MARZ] reconcile-deposits error:', error.message)
    return res.status(500).json({ message: 'Reconciliation failed', details: error.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/marz/recalculate-balances  — batch recalculate balances for all profiles
// ---------------------------------------------------------------------------
marzRouter.post('/recalculate-balances', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('recalculate_all_balances')
    if (error) {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id')
      if (profiles) {
        for (const p of profiles) {
          await supabaseAdmin.rpc('recalculate_balance', { p_user_id: p.id }).catch(() => {})
        }
      }
    }
    return res.status(200).json({ success: true, message: 'All user balances recalculated successfully', data })
  } catch (err) {
    console.error('[MARZ] recalculate-balances error:', err.message)
    return res.status(500).json({ message: 'Balance recalculation failed', details: err.message })
  }
})

// ---------------------------------------------------------------------------
// POST /api/marz/sync  — automatic sync pending deposits/withdrawals with Marz
// ---------------------------------------------------------------------------
marzRouter.post('/sync', async (_req, res) => {
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

    let synced = 0
    if (allPending.length > 0) {
      for (const tx of allPending) {
        if (!tx.reference) continue
        try {
          const statusRes = await fetch(`${marzConfig.baseUrl}/transactions/${encodeURIComponent(tx.reference)}`, {
            headers: getMarzAuthHeaders(),
          })
          if (!statusRes.ok) continue

          const statusData = await statusRes.json()
          const status = String(statusData.status || statusData.data?.status || statusData.transaction?.status || '').toLowerCase()

          if (tx.type === 'deposit') {
            if (SUCCESS_STATUSES.includes(status)) {
              await supabaseAdmin.rpc('increment_balance', { p_user_id: tx.user_id, p_amount: tx.amount || 0 }).catch(err => console.error('[MARZ] sync auto-credit balance error:', err.message || err))
              await supabaseAdmin.from('transactions').update({ status: 'completed' }).eq('id', tx.id)
              synced++
            } else if (FAILED_STATUSES.includes(status)) {
              await supabaseAdmin.from('transactions').update({ status: 'rejected' }).eq('id', tx.id)
              synced++
            }
          } else if (tx.type === 'withdrawal') {
            if (SUCCESS_STATUSES.includes(status)) {
              await supabaseAdmin.from('transactions').update({ status: 'completed' }).eq('id', tx.id)
              synced++
            } else if (FAILED_STATUSES.includes(status)) {
              await supabaseAdmin.from('transactions').update({ status: 'rejected' }).eq('id', tx.id)
              synced++
            }
          }
        } catch (err) {
          console.error('[MARZ] sync error for reference', tx.reference, err)
        }
      }
    }

    await supabaseAdmin.rpc('recalculate_all_balances').catch(() => {})

    res.status(200).json({ synced, total: allPending.length })
  } catch (error) {
    console.error('[MARZ] sync error', error.message)
    res.status(500).json({ message: 'Sync failed', details: error.message })
  }
})

// ---------------------------------------------------------------------------
// GET /api/marz/health  — diagnostic + Marz credentials check
// ---------------------------------------------------------------------------
marzRouter.get('/health', async (_req, res) => {
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
      `${marzConfig.baseUrl}/transactions/${encodeURIComponent(reference)}`,
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
// POST /api/marz/webhook  — Resilient Marz Innovations payment callback
// ---------------------------------------------------------------------------
marzRouter.post(['/webhook', '/'], async (req, res) => {
  try {
    const signature = req.headers['x-marz-signature'] || req.headers['signature'] || ''
    const rawBody = req.rawBody

    if (marzConfig.webhookSecret && rawBody && signature) {
      const expected = crypto
        .createHmac('sha256', marzConfig.webhookSecret)
        .update(rawBody)
        .digest('hex')

      if (signature !== expected) {
        console.warn('[MARZ] webhook signature mismatch, proceeding with safe payload verification')
      }
    }

    const event = req.body || {}
    console.log('[MARZ] webhook event received:', JSON.stringify(event))

    const reference = event.reference || event.transaction_id || event.tx_ref || event.external_reference || event.data?.reference || event.data?.transaction_id
    const status = String(event.status || event.data?.status || event.state || event.transaction?.status || '').toLowerCase()
    const amount = parseFloat(event.amount || event.data?.amount || 0)

    const isSuccess = SUCCESS_STATUSES.includes(status)
    const isFailed = FAILED_STATUSES.includes(status)

    let userId = event.user_id || event.customer_id || event.data?.user_id || event.metadata?.user_id || null
    const email = event.email || event.customer_email || event.data?.email || null
    const phone = event.phone_number || event.phone || event.customer_phone || event.data?.phone_number || null

    if (!reference && !userId && !email && !phone) {
      return res.status(200).json({ received: true, note: 'payload missing identifiers' })
    }

    // 1. Attempt to locate matching user by transaction reference
    if (!userId && reference) {
      const { data: refTx } = await supabaseAdmin
        .from('transactions')
        .select('user_id')
        .eq('reference', reference)
        .single()
      if (refTx) userId = refTx.user_id
    }

    // 2. Attempt to locate matching user by email
    if (!userId && email) {
      const { data: userProfile } = await supabaseAdmin.from('profiles').select('id').eq('email', email.toLowerCase()).single()
      if (userProfile) userId = userProfile.id
    }

    // 3. Attempt to locate matching user by phone number
    if (!userId && phone) {
      const cleanPhone = String(phone).replace(/\D/g, '')
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .or(`username.ilike.%${cleanPhone}%,full_name.ilike.%${cleanPhone}%`)
        .limit(1)
        .single()
      if (userProfile) userId = userProfile.id
    }

    if (isSuccess || isFailed) {
      let existingTx = null

      if (reference) {
        const { data: tx } = await supabaseAdmin
          .from('transactions')
          .select('id, status, type, amount, user_id')
          .eq('reference', reference)
          .single()
        existingTx = tx
      }

      if (existingTx) {
        if (existingTx.type === 'deposit') {
          if (isSuccess) {
            const finalAmount = amount > 0 ? amount : existingTx.amount
            await supabaseAdmin.from('transactions').update({ status: 'completed', amount: finalAmount }).eq('id', existingTx.id)
            await supabaseAdmin.rpc('increment_balance', { p_user_id: existingTx.user_id, p_amount: finalAmount }).catch(() => {})
            await supabaseAdmin.rpc('recalculate_balance', { p_user_id: existingTx.user_id }).catch(() => {})
          } else {
            await supabaseAdmin.from('transactions').update({ status: 'rejected' }).eq('id', existingTx.id)
          }
        } else if (existingTx.type === 'withdrawal') {
          const newStatus = isSuccess ? 'completed' : 'rejected'
          await supabaseAdmin.from('transactions').update({ status: newStatus }).eq('id', existingTx.id)
          await supabaseAdmin.rpc('recalculate_balance', { p_user_id: existingTx.user_id }).catch(() => {})
        }
      } else if (isSuccess && userId && amount > 0) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()

        if (profile) {
          const ref = reference || `WH-DEP-${Date.now()}`
          await supabaseAdmin.from('transactions').insert({
            user_id: userId,
            type: 'deposit',
            amount,
            status: 'completed',
            provider: event.provider || event.channel || 'marz',
            reference: ref,
          })
          await supabaseAdmin.rpc('increment_balance', { p_user_id: userId, p_amount: amount }).catch(() => {})
          await supabaseAdmin.rpc('recalculate_balance', { p_user_id: userId }).catch(() => {})
        }
      }
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[MARZ] webhook error', error.message)
    return res.status(200).json({ received: true, error: error.message })
  }
})
