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
 * Accepts: 07XXXXXXXX, 256XXXXXXXXX, +256XXXXXXXXX, 7XXXXXXXX
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
