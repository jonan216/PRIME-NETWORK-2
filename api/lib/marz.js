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
