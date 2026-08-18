import { useState, useEffect } from 'react'
import { Search, Filter, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Users, ArrowLeftRight, DollarSign, Loader2 } from 'lucide-react'
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

export default function TransactionsPage() {
  const { profile, refreshProfile } = useAuth()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      if (!profile?.id) return
      setLoading(true)

      await refreshProfile()

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setTransactions(data)
      } else if (error) {
        console.error('Error loading transactions:', mapSupabaseError(error))
      }
      setLoading(false)
    }

    fetchTransactions()
  }, [profile?.id])

  const filtered = transactions.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false
    if (search && !(tx.type || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Deposits',
      withdrawal: 'Withdrawals',
      investment: 'Package Investments',
      earning: 'Earnings',
      referral_reward: 'Referral Rewards',
    }
    return labels[type] || type
  }

  const getIcon = (type: string) => {
    const icons: Record<string, any> = {
      deposit: ArrowDownToLine,
      withdrawal: ArrowUpFromLine,
      investment: TrendingUp,
      earning: DollarSign,
      referral_reward: Users,
    }
    return icons[type] || ArrowLeftRight
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">Transactions</h1>
        <p className="text-text-secondary mt-1">View all your transaction history</p>
      </div>

      <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-text-secondary" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All Transactions</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="investment">Package Investments</option>
              <option value="earning">Earnings</option>
              <option value="referral_reward">Referral Rewards</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-accent" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Date & Time</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Type</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Provider</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Amount</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {filtered.map(tx => {
                  const Icon = getIcon(tx.type)
                  return (
                    <tr key={tx.id}>
                      <td className="py-4 text-sm text-text-secondary whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            tx.type === 'deposit' || tx.type === 'earning' ? 'bg-status-success/10' :
                            tx.type === 'withdrawal' ? 'bg-status-error/10' :
                            'bg-accent/10'
                          }`}>
                            <Icon size={18} className={
                              tx.type === 'deposit' || tx.type === 'earning' ? 'text-status-success' :
                              tx.type === 'withdrawal' ? 'text-status-error' :
                              'text-accent'
                            } />
                          </div>
                          <span className="text-sm font-medium text-text-primary capitalize">{getTypeLabel(tx.type)}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-text-secondary">{tx.provider || '—'}</td>
                      <td className={`py-4 text-sm font-medium text-right ${
                        tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'referral_reward'
                          ? 'text-status-success' : 'text-text-primary'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'referral_reward' ? '+' : '-'}
                        {formatDualCurrency(tx.amount)}
                      </td>
                      <td className="py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.status === 'completed' || tx.status === 'approved' ? 'bg-status-success/10 text-status-success' :
                          tx.status === 'pending' ? 'bg-status-warning/10 text-status-warning' :
                          'bg-status-error/10 text-status-error'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-secondary text-sm">
                      No transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
