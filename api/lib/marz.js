import axios from 'axios'

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

/**
 * Normalise a Ugandan phone number to E.164 format (+256XXXXXXXXX).
 * Accepts: 07XXXXXXXX, 256XXXXXXXXX, +256XXXXXXXXX
 */
export function formatPhone(phone) {
  const digits = String(phone).replace(/\D/g, '')

  if (digits.startsWith('256') && digits.length === 12) {
    return `+${digits}`
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+256${digits.slice(1)}`
  }
  if (digits.length === 9) {
    return `+256${digits}`
  }
  return String(phone).startsWith('+') ? String(phone) : `+${digits}`
}

/**
 * Initiate a MoMo/Airtel collection.
 * @param {object} payload
 * @param {number} payload.amount   Amount in UGX (no conversion done here)
 * @param {string} payload.phone    Phone number (will be normalised to E.164)
 * @param {string} payload.provider e.g. 'mtn_momo' | 'airtel_money'
 * @param {string} [payload.reference]
 * @param {string} [payload.user_id]
 */
export async function initiateCollectMoney(payload) {
  const response = await axios.post(`${marzConfig.baseUrl}/collect-money`, {
    amount: Math.round(payload.amount),
    currency: 'UGX',
    country: 'UG',
    phone_number: formatPhone(payload.phone),
    provider: payload.provider,
    reference: payload.reference || `PRIME-${Date.now()}`,
    callback_url: marzConfig.callbackUrl,
    user_id: payload.user_id,
  }, { headers: getMarzAuthHeaders() })
  return response.data
}

/**
 * Initiate a MoMo/Airtel disbursement (withdrawal).
 * @param {object} payload
 * @param {number} payload.amount   Amount in UGX (no conversion done here)
 * @param {string} payload.phone    Phone number (will be normalised to E.164)
 * @param {string} payload.provider e.g. 'mtn_momo' | 'airtel_money'
 * @param {string} [payload.reference]
 * @param {string} [payload.user_id]
 */
export async function initiateDisburse(payload) {
  const response = await axios.post(`${marzConfig.baseUrl}/send-money`, {
    amount: Math.round(payload.amount),
    currency: 'UGX',
    country: 'UG',
    phone_number: formatPhone(payload.phone),
    provider: payload.provider,
    reference: payload.reference || `PRIME-WD-${Date.now()}`,
    callback_url: marzConfig.callbackUrl,
    user_id: payload.user_id,
  }, { headers: getMarzAuthHeaders() })
  return response.data
}

export async function getTransactionStatus(reference) {
  const response = await axios.get(
    `${marzConfig.baseUrl}/transactions/${encodeURIComponent(reference)}`,
    { headers: getMarzAuthHeaders() }
  )
  return response.data
}
