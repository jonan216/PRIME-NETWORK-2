import { Router } from 'express'
import crypto from 'crypto'
import { marzConfig, getMarzAuthHeaders, formatPhone, initiateCollectMoney, initiateDisburse, getTransactionStatus } from '../lib/marz.js'
import axios from 'axios'

export const marzRouter = Router()

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
    const reference_ = reference || `PRIME-${Date.now()}`

    const response = await axios.post(`${marzConfig.baseUrl}/collect-money`, {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: formatPhone(phone),
      provider,
      reference: reference_,
      callback_url: marzConfig.callbackUrl,
      user_id,
    }, { headers: getMarzAuthHeaders() })

    return res.status(200).json({
      status: 'initiated',
      data: response.data,
      reference: reference_,
      ugxAmount,
    })
  } catch (error) {
    console.error('[MARZ] collect-money error', error.response?.data || error.message)
    return res.status(500).json({
      message: 'Failed to initiate payment',
      details: error.response?.data || error.message,
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
    const reference_ = reference || `PRIME-WD-${Date.now()}`

    const response = await axios.post(`${marzConfig.baseUrl}/send-money`, {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: formatPhone(phone),
      provider,
      reference: reference_,
      callback_url: marzConfig.callbackUrl,
      user_id,
    }, { headers: getMarzAuthHeaders() })

    return res.status(200).json({
      status: 'initiated',
      data: response.data,
      reference: reference_,
      ugxAmount,
    })
  } catch (error) {
    console.error('[MARZ] disburse error', error.response?.data || error.message)
    return res.status(500).json({
      message: 'Failed to initiate withdrawal',
      details: error.response?.data || error.message,
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
//
// IMPORTANT: This route uses rawBody (set in server/index.js) to compute
// HMAC-SHA256 over the exact bytes received, before JSON parsing mutates them.
// ---------------------------------------------------------------------------
marzRouter.post('/webhook', (req, res) => {
  try {
    const signature = req.headers['x-marz-signature'] || ''

    // Use the raw buffer captured before express.json() processed the body
    const rawBody = req.rawBody
    if (!rawBody) {
      console.error('[MARZ] rawBody missing — check server middleware setup')
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

    // TODO: update transaction status in your database here based on event.status
    // e.g. if (event.status === 'credited') { ... credit user wallet ... }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[MARZ] webhook error', error.message)
    return res.status(500).json({ message: 'Webhook processing failed' })
  }
})
