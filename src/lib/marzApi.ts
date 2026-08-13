const API_BASE = '/api'

export async function initiateDeposit(payload: {
  amount: number
  currency?: string
  phone: string
  provider: string
  reference?: string
  user_id?: string
}) {
  const res = await fetch(`${API_BASE}/marz/collect-money`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message || 'Failed to initiate deposit')
  }
  return res.json()
}

export async function initiateWithdrawal(payload: {
  amount: number
  currency?: string
  phone: string
  provider: string
  reference?: string
  user_id?: string
}) {
  const res = await fetch(`${API_BASE}/marz/disburse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message || 'Failed to initiate withdrawal')
  }
  return res.json()
}

export async function getTransactionStatus(reference: string) {
  const res = await fetch(`${API_BASE}/marz/transaction/${encodeURIComponent(reference)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message || 'Failed to fetch transaction status')
  }
  return res.json()
}
