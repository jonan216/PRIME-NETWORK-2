import { useState } from 'react'
import { ShieldCheck, Wallet, Building2, CreditCard, ArrowRight, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { initiateDeposit, getTransactionStatus } from '../lib/marzApi'
import { useAuth } from '../context/AuthContext'
import { formatDualCurrency } from '../lib/currency'


type PaymentStatus = 'idle' | 'pending' | 'waiting' | 'completed' | 'failed'

export default function DepositPage() {
  const { user, profile, refreshProfile } = useAuth()
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

    if (!user?.id) {
      setError('You must be logged in to make a deposit')
      return
    }

    try {
      const ugxValue = parseFloat(amount)

      if (isNaN(ugxValue) || ugxValue < 5000) {
        setError('Minimum deposit amount is UGX 5,000')
        return
      }

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
        setError('Invalid user session. Please log out and log in again.')
        return
      }

      // Auto-format phone to E.164 (+256XXXXXXXXX) before sending
      let formattedPhone = phone.replace(/\D/g, '')
      if (formattedPhone.startsWith('0') && formattedPhone.length === 10) {
        formattedPhone = '+256' + formattedPhone.slice(1)
      } else if (formattedPhone.startsWith('256') && formattedPhone.length === 12) {
        formattedPhone = '+' + formattedPhone
      } else if (formattedPhone.length === 9) {
        formattedPhone = '+256' + formattedPhone
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+256' + formattedPhone
      }

      const result = await initiateDeposit({
        amount: ugxValue,
        currency: 'UGX',
        phone: formattedPhone,
        provider,
        reference: `DEP-${Date.now()}`,
        user_id: user.id,
      })

      // USSD prompt successfully pushed to user's phone.
      // Transition UI to 'waiting' state so user sees the PIN prompt instruction on screen.
      setStatus('waiting')

      const txRef = result.reference || result.data?.reference || result.data?.data?.transaction?.reference || result.transaction?.reference
      if (!txRef) {
        console.warn('No reference returned for transaction status polling')
        return
      }

      // Trigger backend sync with Marz
      fetch('/api/marz/sync', { method: 'POST' }).catch(() => {})

      const interval = setInterval(async () => {
        try {
          const statusResult = await getTransactionStatus(txRef)
          const txStatus = String(
            statusResult.status ||
            statusResult.data?.status ||
            statusResult.data?.transaction?.status ||
            statusResult.transaction?.status ||
            ''
          ).toLowerCase()

          if (['credited', 'completed', 'successful', 'paid', 'success', 'sandbox'].includes(txStatus)) {
            clearInterval(interval)
            setStatus('completed')
            try {
              await fetch('/api/marz/sync', { method: 'POST' })
            } catch {
              // sync is best-effort; webhook may still complete it
            }
            refreshProfile()
          } else if (['failed', 'rejected', 'cancelled', 'expired'].includes(txStatus)) {
            setStatus('failed')
            clearInterval(interval)
          }
        } catch {
          // Keep polling while waiting for user to enter PIN
        }
      }, 3000)

      // Keep polling up to 2 minutes for user PIN entry
      setTimeout(() => clearInterval(interval), 120000)
    } catch (err: any) {
      // Provide friendly errors for common Marz Innovations failure reasons
      let errorMsg = err.message || 'Failed to initiate deposit'
      if (errorMsg.toLowerCase().includes('no collection services') || errorMsg.toLowerCase().includes('available for country')) {
        errorMsg = 'Mobile money collection is not yet active on this account. Please contact support or try again later.'
      }
      setError(errorMsg)
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
            ) : status === 'failed' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mb-4">
                  <XCircle size={32} className="text-status-error" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Payment Failed</h3>
                <p className="text-text-secondary mb-6">Your payment could not be processed. Please try again.</p>
                <button
                  onClick={() => { setStatus('idle'); setAmount(''); setPhone('') }}
                  className="px-6 py-3 bg-cream-secondary hover:bg-cream-border text-text-primary rounded-xl font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Amount (UGX)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">UGX</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="5000"
                        required
                        min={5000}
                        className="w-full pl-14 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-text-secondary">
                    <span>Minimum deposit: <strong>UGX 5,000</strong></span>
                    {amount && parseFloat(amount) > 0 && (
                      <span className="text-accent font-semibold">
                        ≈ ${(parseFloat(amount) / 3700).toFixed(2)} USD
                      </span>
                    )}
                  </div>
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
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono text-sm">+256</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => {
                          // Strip any non-digit characters (user can type local 9-10 digit number)
                          const raw = e.target.value.replace(/\D/g, '')
                          setPhone(raw)
                        }}
                        placeholder="781969741"
                        required
                        maxLength={10}
                        className="w-full pl-16 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
                      />
                    </div>
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
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                      <Loader2 size={22} className="animate-spin flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">USSD PIN Prompt Pushed to Phone</p>
                        <p className="text-xs opacity-90">Target Number: <span className="font-mono font-bold">{phone}</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed pl-8">
                      Please check your mobile phone now and enter your <strong>Mobile Money PIN</strong> to authorize the transfer. The system is actively waiting for network confirmation.
                    </p>
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Deposit Information</h3>

              <div className="bg-cream-soft rounded-xl p-4 border border-cream-border mb-4">
                <p className="text-xs font-medium text-text-secondary mb-1">Current Wallet Balance</p>
                <p className="text-xl font-bold text-accent">{formatDualCurrency(profile?.balance ?? 0)}</p>
              </div>

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
