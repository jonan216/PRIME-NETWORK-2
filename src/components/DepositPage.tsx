import { useState } from 'react'
import { ShieldCheck, Wallet, Building2, CreditCard, ArrowRight, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { initiateDeposit, getTransactionStatus } from '../lib/marzApi'
import { useAuth } from '../context/AuthContext'

type PaymentStatus = 'idle' | 'pending' | 'waiting' | 'completed' | 'failed'

export default function DepositPage() {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [provider, setProvider] = useState<'mtn_momo' | 'airtel_money' | 'visa' | 'mastercard' | 'bank_transfer'>('mtn_momo')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [error, setError] = useState('')

  const providers = [
    { value: 'mtn_momo', label: 'MTN Mobile Money', icon: Wallet },
    { value: 'airtel_money', label: 'Airtel Money', icon: Wallet },
    { value: 'visa', label: 'Visa', icon: CreditCard },
    { value: 'mastercard', label: 'Mastercard', icon: CreditCard },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
  ]

  const selectedProvider = providers.find(p => p.value === provider)



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatus('pending')

    try {
      const ugxValue = parseFloat(amount)
      const result = await initiateDeposit({
        amount: ugxValue,
        currency: 'UGX',
        phone,
        provider,
        reference: `DEP-${Date.now()}`,
        user_id: user?.id ?? 'guest',
      })

      if (result.data?.status === 'success' || result.data?.message?.includes('Sandbox Mode')) {
        setStatus('completed')
        return
      }

      setStatus('waiting')

      const interval = setInterval(async () => {
        try {
          const statusResult = await getTransactionStatus(result.reference)
          const txStatus = statusResult.status || statusResult.data?.status

          if (txStatus === 'credited' || txStatus === 'completed' || txStatus === 'success') {
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
      setError(err.message || 'Failed to initiate deposit')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">Deposit</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-6">Make a Deposit</h2>

            {status === 'completed' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-status-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-status-success" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Payment Confirmed!</h3>
                <p className="text-text-secondary mb-6">Your wallet has been updated.</p>
                <button
                  onClick={() => { setStatus('idle'); setAmount(''); setPhone('') }}
                  className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
                >
                  Make Another Deposit
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Amount (UGX)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">UGX</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0"
                      required
                      min={18500}
                      className="w-full pl-14 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Minimum deposit: UGX 18,500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Payment Method</label>
                  <div className="relative">
                    <select
                      value={provider}
                      onChange={e => setProvider(e.target.value as any)}
                      className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      {providers.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {provider === 'mtn_momo' || provider === 'airtel_money' ? 'Phone Number' : 'Details'}
                  </label>
                  {provider === 'mtn_momo' || provider === 'airtel_money' ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 0781969741"
                      required
                      className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  ) : (
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={3}
                      placeholder="Enter details..."
                      className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                    />
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-status-error text-sm">
                    <XCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'pending' || status === 'waiting'}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  {status === 'pending' || status === 'waiting' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {status === 'waiting' ? 'Waiting for confirmation...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      Deposit Now
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {status === 'waiting' && (
                  <div className="flex items-start gap-2 text-status-warning text-sm bg-status-warning/5 border border-status-warning/20 rounded-xl p-3">
                    <Clock size={16} className="mt-0.5 flex-shrink-0" />
                    <span>A payment prompt has been sent to your phone. Please enter your PIN to confirm.</span>
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Deposit Information</h3>

              {selectedProvider && (
                <div className="flex items-center gap-3 mb-4">
                  <selectedProvider.icon size={20} className="text-accent" />
                  <span className="text-sm font-medium text-text-primary">{selectedProvider.label}</span>
                </div>
              )}

              <div className="bg-cream-soft rounded-xl p-4 border border-cream-border space-y-3">
                {provider === 'mtn_momo' && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Merchant Code</p>
                      <p className="text-sm text-text-primary font-mono">PRIME-MOMO</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Paybill / Merchant</p>
                      <p className="text-sm text-text-primary font-mono">404048</p>
                    </div>
                  </>
                )}
                {provider === 'airtel_money' && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Merchant Code</p>
                      <p className="text-sm text-text-primary font-mono">PRIME-AIRTEL</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Paybill / Merchant</p>
                      <p className="text-sm text-text-primary font-mono">404048</p>
                    </div>
                  </>
                )}
                {provider === 'bank_transfer' && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Bank Name</p>
                      <p className="text-sm text-text-primary font-medium">Prime National Bank</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Account Name</p>
                      <p className="text-sm text-text-primary font-medium">Prime Network Investments LLC</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-1">Account Number</p>
                      <p className="text-sm text-text-primary font-mono">****4589</p>
                    </div>
                  </>
                )}
                {provider === 'visa' && (
                  <div>
                    <p className="text-xs font-medium text-text-secondary mb-1">Accepted</p>
                    <p className="text-sm text-text-primary">Visa, Visa Electron</p>
                  </div>
                )}
                {provider === 'mastercard' && (
                  <div>
                    <p className="text-xs font-medium text-text-secondary mb-1">Accepted</p>
                    <p className="text-sm text-text-primary">Mastercard, Maestro</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-cream-border">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Secure Payments via MarzPay</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Your transactions are secured with end-to-end encryption. Funds are only credited after payment confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
