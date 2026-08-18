import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, CircleDollarSign, ArrowDownToLine, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, mapSupabaseError } from '../lib/supabaseClient'
import { formatDualCurrency } from '../lib/currency'

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  provider?: string
  created_at: string
}

interface Investment {
  id: string
  plan_name: string
  amount: number
  daily_roi: number
  status: string
  created_at: string
}

export default function WalletView() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWalletData() {
      if (!profile?.id) return
      setLoading(true)

      const [txRes, invRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('investments').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
      ])

      if (txRes.error) {
        console.error('Error loading transactions:', mapSupabaseError(txRes.error))
      } else if (txRes.data) {
        setTransactions(txRes.data)
      }
      if (invRes.error) {
        console.error('Error loading investments:', mapSupabaseError(invRes.error))
      } else if (invRes.data) {
        setInvestments(invRes.data)
      }
      setLoading(false)
    }

    loadWalletData()
  }, [profile?.id])

  const availableBalance = transactions.reduce((sum, tx) => {
    const amount = tx.amount || 0
    if (tx.type === 'deposit' && (tx.status === 'completed' || tx.status === 'approved')) return sum + amount
    if (tx.type === 'withdrawal' && (tx.status === 'completed' || tx.status === 'approved')) return sum - amount
    if (tx.type === 'investment' && tx.status === 'active') return sum - amount
    if (tx.type === 'earning' && (tx.status === 'completed' || tx.status === 'approved')) return sum + amount
    if (tx.type === 'referral_reward' && (tx.status === 'completed' || tx.status === 'approved')) return sum + amount
    if (tx.type === 'refund' && tx.status === 'completed') return sum + amount
    return sum
  }, 0)
  const totalInvested = investments
    .filter(i => i.status === 'active')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalEarnings = transactions
    .filter(t => t.type === 'earning' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const stats = [
    { label: 'Available Balance', value: formatDualCurrency(availableBalance), icon: Wallet, color: 'text-accent' },
    { label: 'Total Invested', value: formatDualCurrency(totalInvested), icon: TrendingUp, color: 'text-text-primary' },
    { label: 'Total Earnings', value: formatDualCurrency(totalEarnings), icon: CircleDollarSign, color: 'text-status-success' },
    { label: 'Withdrawable Balance', value: formatDualCurrency(availableBalance), icon: ArrowDownToLine, color: 'text-status-success' }
  ]

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-8">
          Wallet
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                  <Icon size={20} className={card.color} />
                </div>
                <p className="text-text-secondary text-sm mb-1">{card.label}</p>
                <p className="text-xl font-bold text-accent">
                  {card.value}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-display font-bold text-text-primary mb-6">
            Recent Transactions
          </h2>
          <div className="bg-cream-card rounded-cream-lg border border-cream-border shadow-cream overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-accent" size={28} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-border">
                      <th className="text-left px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Date & Time</th>
                      <th className="text-left px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Type</th>
                      <th className="text-left px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Provider</th>
                      <th className="text-right px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Amount</th>
                      <th className="text-right px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cream-soft/30 transition-colors">
                        <td className="px-6 py-4 text-text-primary text-sm whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-text-primary text-sm capitalize">
                          {tx.type}
                        </td>
                        <td className="px-6 py-4 text-text-secondary text-sm">{tx.provider || '—'}</td>
                        <td className={`px-6 py-4 text-sm font-medium text-right ${
                          tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'referral_reward'
                            ? 'text-status-success' : 'text-text-primary'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'referral_reward' ? '+' : '-'}
                          {formatDualCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'completed' || tx.status === 'approved' ? 'bg-status-success/10 text-status-success' :
                            tx.status === 'pending' || tx.status === 'pending_approval' ? 'bg-status-warning/10 text-status-warning' :
                            'bg-status-error/10 text-status-error'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-text-secondary text-sm">
                          No wallet transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
