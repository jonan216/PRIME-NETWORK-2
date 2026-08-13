import { useState } from 'react'
import { Search, Filter, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Users, ArrowLeftRight, DollarSign } from 'lucide-react'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'investment' | 'earning' | 'referral_reward' | 'transfer_in' | 'transfer_out'
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  timestamp: string
}

const transactions: Transaction[] = [
  { id: '1', type: 'deposit', description: 'Deposit via MTN Mobile Money', amount: 2000, status: 'completed', timestamp: '2026-08-12 09:22:28' },
  { id: '2', type: 'earning', description: 'Investment Return - Growth Plan', amount: 350, status: 'completed', timestamp: '2026-08-12 08:15:00' },
  { id: '3', type: 'withdrawal', description: 'Withdrawal to Bank Account', amount: 500, status: 'completed', timestamp: '2026-08-11 16:45:00' },
  { id: '4', type: 'referral_reward', description: 'Referral Commission - Sarah M.', amount: 120, status: 'completed', timestamp: '2026-08-11 12:30:00' },
  { id: '5', type: 'investment', description: 'Investment in Premium Plan', amount: 2500, status: 'completed', timestamp: '2026-08-10 14:20:00' },
  { id: '6', type: 'deposit', description: 'Deposit via Bank Transfer', amount: 1000, status: 'pending', timestamp: '2026-08-10 10:00:00' },
  { id: '7', type: 'transfer_out', description: 'Transfer to friend', amount: 300, status: 'completed', timestamp: '2026-08-09 18:30:00' },
  { id: '8', type: 'transfer_in', description: 'Transfer received from David', amount: 500, status: 'completed', timestamp: '2026-08-09 14:20:00' },
]

export default function TransactionsPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = transactions.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Deposits',
      withdrawal: 'Withdrawals',
      investment: 'Package Investments',
      earning: 'Earnings',
      referral_reward: 'Referral Rewards',
      transfer_in: 'Transfers In',
      transfer_out: 'Transfers Out',
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
      transfer_in: ArrowLeftRight,
      transfer_out: ArrowLeftRight,
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
              <option value="transfer_in">Transfers In</option>
              <option value="transfer_out">Transfers Out</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream-border">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Date & Time</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Description</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Type</th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Amount</th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {filtered.map(tx => {
                const Icon = getIcon(tx.type)
                return (
                  <tr key={tx.id}>
                    <td className="py-4 text-sm text-text-secondary">{tx.timestamp}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          tx.type === 'deposit' || tx.type === 'transfer_in' ? 'bg-status-success/10' :
                          tx.type === 'withdrawal' || tx.type === 'transfer_out' ? 'bg-status-error/10' :
                          'bg-accent/10'
                        }`}>
                          <Icon size={18} className={
                            tx.type === 'deposit' || tx.type === 'transfer_in' ? 'text-status-success' :
                            tx.type === 'withdrawal' || tx.type === 'transfer_out' ? 'text-status-error' :
                            'text-accent'
                          } />
                        </div>
                        <span className="text-sm font-medium text-text-primary">{tx.description}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        {getTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className={`py-4 text-sm font-medium text-right ${
                      tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'referral_reward' || tx.type === 'transfer_in' 
                        ? 'text-status-success' : 'text-text-primary'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'referral_reward' || tx.type === 'transfer_in' ? '+' : '-'}
                      ${tx.amount.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'completed' ? 'bg-status-success/10 text-status-success' :
                        tx.status === 'pending' ? 'bg-status-warning/10 text-status-warning' :
                        'bg-status-error/10 text-status-error'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
