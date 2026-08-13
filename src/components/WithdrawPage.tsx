import { useState } from 'react'
import { ArrowUpRight, Wallet, Building2, History, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { initiateWithdrawal, getTransactionStatus } from '../lib/marzApi'

type PaymentStatus = 'idle' | 'pending' | 'waiting' | 'completed' | 'failed'

interface Withdrawal {
  id: string
  date: string
  method: string
  amount: number
  status: 'completed' | 'pending' | 'processing'
}

const mockWithdrawals: Withdrawal[] = [
  { id: '1', date: '2026-08-05', method: 'MTN Mobile Money', amount: 1500.00, status: 'completed' },
  { id: '2', date: '2026-08-02', method: 'Bank Transfer', amount: 800.00, status: 'processing' },
  { id: '3', date: '2026-07-28', method: 'Airtel Money', amount: 2200.00, status: 'completed' },
]

export default function WithdrawPage() {
  const [amount, setAmount] = useState('')
  const [provider, setProvider] = useState<'mtn_momo' | 'airtel_money' | 'bank_transfer'>('mtn_momo')
  const [phone, setPhone] = useState('')
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [error, setError] = useState('')

  const methods = [
    { value: 'mtn_momo', label: 'MTN Mobile Money', icon: Wallet },
    { value: 'airtel_money', label: 'Airtel Money', icon: Wallet },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatus('pending')

    try {
      const result = await initiateWithdrawal({
        amount: parseFloat(amount),
        currency: 'UGX',
        phone,
        provider,
        reference: `WD-${Date.now()}`,
        user_id: '1',
      })

      setStatus('waiting')

      const interval = setInterval(async () => {
        try {
          const statusResult = await getTransactionStatus(result.reference)
          const txStatus = statusResult.status || statusResult.data?.status

          if (txStatus === 'credited' || txStatus === 'completed') {
            setStatus('completed')
            clearInterval(interval)
          } else if (txStatus === 'failed' || txStatus === 'rejected') {
            setStatus('failed')
            clearInterval(interval)
          }
        } catch {
          // keep polling
        }
      }, 3000)

      setTimeout(() => clearInterval(interval), 60000)
    } catch (err: any) {
      const msg = err.message || 'Failed to initiate withdrawal'
      setError(msg.includes('not support') ? 'Withdrawals are processed manually. Please contact support.' : msg)
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">Withdraw</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-cream-card rounded-cream-lg border border-cream-border p-6">
            {status === 'completed' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-status-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-status-success" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Withdrawal Initiated!</h3>
                <p className="text-text-secondary mb-6">Your withdrawal is being processed. You will receive a confirmation shortly.</p>
                <button
                  onClick={() => { setStatus('idle'); setAmount(''); setPhone('') }}
                  className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
                >
                  Make Another Withdrawal
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm text-text-secondary mb-1">Available Balance</p>
                  <p className="text-4xl font-display font-semibold text-accent">$4,380.00</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      min={10}
                      className="w-full pl-8 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Minimum withdrawal: $10.00</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Withdrawal Method</label>
                    <div className="relative">
                      <select
                        value={provider}
                        onChange={e => setProvider(e.target.value as any)}
                        className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        {methods.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {provider === 'bank_transfer' ? 'Bank Details' : 'Phone Number'}
                    </label>
                    {provider === 'bank_transfer' ? (
                      <textarea
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        rows={3}
                        placeholder="Enter your bank account details..."
                        className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                      />
                    ) : (
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 0781969741"
                        required
                        className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-status-error text-sm">
                      <XCircle size={16} />
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-text-secondary">Processing time: 1-24 hours</p>
                    <button
                      type="submit"
                      disabled={status === 'pending' || status === 'waiting'}
                      className="flex items-center gap-2 px-6 py-3.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                    >
                      {status === 'pending' || status === 'waiting' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Request Withdrawal
                          <ArrowUpRight size={18} />
                        </>
                      )}
                    </button>
                  </div>

                  {status === 'waiting' && (
                    <div className="flex items-start gap-2 text-status-warning text-sm bg-status-warning/5 border border-status-warning/20 rounded-xl p-3">
                      <Clock size={16} className="mt-0.5 flex-shrink-0" />
                      <span>Your withdrawal request is being processed. You will receive a confirmation shortly.</span>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>

          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-accent" />
              <h3 className="text-lg font-semibold text-text-primary">Recent Withdrawals</h3>
            </div>

            <div className="space-y-4">
              {mockWithdrawals.map(w => (
                <div key={w.id} className="flex items-center justify-between py-3 border-b border-cream-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{w.method}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{w.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-primary">${w.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <span className={`inline-block text-xs font-medium mt-0.5 ${
                      w.status === 'completed' ? 'text-status-success' :
                      w.status === 'pending' ? 'text-status-warning' :
                      'text-text-secondary'
                    }`}>
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
