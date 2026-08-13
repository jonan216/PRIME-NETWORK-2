import axios from 'axios'
import crypto from 'crypto'

export const marzConfig = {
  baseUrl: process.env.MARZ_INNOVATIONS_BASE_URL || 'https://wallet.wearemarz.com/api/v1',
  apiKey: process.env.MARZ_INNOVATIONS_API_KEY || '',
  apiSecret: process.env.MARZ_INNOVATIONS_API_SECRET || '',
  callbackUrl: process.env.MARZPAY_CALLBACK_URL || '',
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
}

export function getMarzAuthHeaders() {
  const credentials = Buffer.from(`${marzConfig.apiKey}:${marzConfig.apiSecret}`).toString('base64')
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  }
}

export async function initiateCollectMoney(payload) {
  const usdAmount = parseFloat(payload.amount)
  const ugxAmount = Math.round(usdAmount * 3700)

  const response = await axios.post(`${marzConfig.baseUrl}/collect-money`, {
    amount: ugxAmount,
    currency: 'UGX',
    phone_number: payload.phone,
    provider: payload.provider,
    reference: payload.reference || `PRIME-${Date.now()}`,
    callback_url: marzConfig.callbackUrl,
    user_id: payload.user_id,
  }, { headers: getMarzAuthHeaders() })
  return response.data
}

export async function initiateDisburse(payload) {
  const usdAmount = parseFloat(payload.amount)
  const ugxAmount = Math.round(usdAmount * 3700)

  const response = await axios.post(`${marzConfig.baseUrl}/payout`, {
    amount: ugxAmount,
    currency: 'UGX',
    phone_number: payload.phone,
    provider: payload.provider,
    reference: payload.reference || `PRIME-WD-${Date.now()}`,
    callback_url: marzConfig.callbackUrl,
    user_id: payload.user_id,
  }, { headers: getMarzAuthHeaders() })
  return response.data
}

export async function getTransactionStatus(reference) {
  const response = await axios.get(`${marzConfig.baseUrl}/transaction/${encodeURIComponent(reference)}`, {
    headers: getMarzAuthHeaders(),
  })
  return response.data
}
