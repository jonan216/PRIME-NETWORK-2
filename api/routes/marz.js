import { Router } from 'express'
import axios from 'axios'
import crypto from 'crypto'
import { marzConfig, getMarzAuthHeaders, formatPhone } from '../lib/marz.js'

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

    // amount is received as native UGX — no conversion needed
    const ugxAmount = Math.round(parseFloat(amount))
    const reference_ = reference || `PRIME-${Date.now()}`

    const payload = {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: formatPhone(phone),   // E.164 e.g. +256781969741
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

    // amount is received as native UGX — no conversion needed
    const ugxAmount = Math.round(parseFloat(amount))
    const reference_ = reference || `PRIME-WD-${Date.now()}`

    const payload = {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: formatPhone(phone),   // E.164 e.g. +256781969741
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
// Uses req.rawBody (set in api/index.js) to compute HMAC-SHA256 over the
// exact bytes received — before JSON parsing can alter them.
// ---------------------------------------------------------------------------
marzRouter.post('/webhook', (req, res) => {
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

    // TODO: update the user's wallet balance in your database based on event.status
    // e.g. if (event.status === 'credited') { creditUserWallet(event.user_id, event.amount) }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[MARZ] webhook error', error.message)
    return res.status(500).json({ message: 'Webhook processing failed' })
  }
})
