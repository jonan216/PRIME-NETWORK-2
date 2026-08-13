import { Router } from 'express'
import axios from 'axios'
import crypto from 'crypto'
import { marzConfig, getMarzAuthHeaders, formatPhone } from '../lib/marz.js'

export const marzRouter = Router()

const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

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
      provider,
      reference: reference_,
      callback_url: marzConfig.callbackUrl,
      user_id,
    }

    const response = await axios.post(`${marzConfig.baseUrl}/collect-money`, payload, {
      headers: getMarzAuthHeaders(),
    })

    return res.status(200).json({
      status: 'initiated',
      data: response.data,
      reference: reference_,
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
    const reference_ = isValidUuid(reference) ? reference : crypto.randomUUID()

    const payload = {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: formatPhone(phone),
      provider,
      reference: reference_,
      callback_url: marzConfig.callbackUrl,
      user_id,
    }

    const response = await axios.post(`${marzConfig.baseUrl}/send-money`, payload, {
      headers: getMarzAuthHeaders(),
    })

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
marzRouter.post(['/webhook', '/'], (req, res) => {
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

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[MARZ] webhook error', error.message)
    return res.status(500).json({ message: 'Webhook processing failed' })
  }
})
