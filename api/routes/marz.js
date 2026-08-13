import { Router } from 'express'
import axios from 'axios'
import crypto from 'crypto'
import { marzConfig, getMarzAuthHeaders } from '../lib/marz.js'

export const marzRouter = Router()

marzRouter.post('/collect-money', async (req, res) => {
  try {
    const { amount, currency, phone, provider, reference, user_id } = req.body

    if (!amount || !phone || !provider) {
      return res.status(400).json({ message: 'amount, phone and provider are required' })
    }

    const usdAmount = parseFloat(amount)
    const ugxAmount = Math.round(usdAmount * 3700)

    const payload = {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: phone,
      provider,
      reference: reference || `PRIME-${Date.now()}`,
      callback_url: marzConfig.callbackUrl,
      user_id,
    }

    const response = await axios.post(`${marzConfig.baseUrl}/collect-money`, payload, {
      headers: getMarzAuthHeaders(),
    })

    return res.status(200).json({
      status: 'initiated',
      data: response.data,
      reference: payload.reference,
      usdAmount,
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

marzRouter.post('/disburse', async (req, res) => {
  try {
    const { amount, currency, phone, provider, reference, user_id } = req.body

    if (!amount || !phone || !provider) {
      return res.status(400).json({ message: 'amount, phone and provider are required' })
    }

    const usdAmount = parseFloat(amount)
    const ugxAmount = Math.round(usdAmount * 3700)

    const payload = {
      amount: ugxAmount,
      currency: 'UGX',
      country: 'UG',
      phone_number: phone,
      provider,
      reference: reference || `PRIME-WD-${Date.now()}`,
      callback_url: marzConfig.callbackUrl,
      user_id,
    }

    const response = await axios.post(`${marzConfig.baseUrl}/send-money`, payload, {
      headers: getMarzAuthHeaders(),
    })

    return res.status(200).json({
      status: 'initiated',
      data: response.data,
      reference: payload.reference,
      usdAmount,
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

marzRouter.get('/transaction/:reference', async (req, res) => {
  try {
    const { reference } = req.params
    const response = await axios.get(`${marzConfig.baseUrl}/transaction/${encodeURIComponent(reference)}`, {
      headers: getMarzAuthHeaders(),
    })
    return res.status(200).json(response.data)
  } catch (error) {
    console.error('[MARZ] transaction status error', error.response?.data || error.message)
    return res.status(500).json({
      message: 'Failed to fetch transaction status',
      details: error.response?.data || error.message,
    })
  }
})

marzRouter.post('/webhook', (req, res) => {
  try {
    const signature = req.headers['x-marz-signature'] || ''
    const rawBody = JSON.stringify(req.body)
    const expected = crypto.createHmac('sha256', marzConfig.webhookSecret).update(rawBody).digest('hex')

    if (signature !== expected) {
      console.warn('[MARZ] invalid webhook signature')
      return res.status(401).json({ message: 'Invalid signature' })
    }

    const event = req.body
    console.log('[MARZ] webhook event received', event.reference || event.transaction_id)

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('[MARZ] webhook error', error.message)
    return res.status(500).json({ message: 'Webhook processing failed' })
  }
})
