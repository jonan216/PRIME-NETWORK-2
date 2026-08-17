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
    console.error('[MARZ] collect-money error', errData || error.message)

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
// GET /api/marz/transaction/:reference  — Poll transaction status
// ---------------------------------------------------------------------------
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
          if (isSuccess) {
            await supabaseAdmin.rpc('increment_balance', { p_user_id: existingTx.user_id, p_amount: existingTx.amount || 0 }).catch(err => console.error('[MARZ] auto-credit balance error:', err.message || err))
            await supabaseAdmin.from('transactions').update({ status: 'completed' }).eq('id', existingTx.id)
          } else {
            await supabaseAdmin.from('transactions').update({ status: 'rejected' }).eq('id', existingTx.id)
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
            status: txType === 'deposit' ? 'completed' : 'completed',
            provider: event.provider || event.channel || null,
            reference,
          })

          if (txType === 'deposit') {
            await supabaseAdmin.rpc('increment_balance', { p_user_id: userId, p_amount: amount }).catch(err => console.error('[MARZ] auto-credit balance error:', err.message || err))
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
