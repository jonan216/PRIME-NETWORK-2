import { useState } from 'react'
import { Wallet, TrendingUp, CircleDollarSign, ArrowDownToLine, Send } from 'lucide-react'
import { formatDualCurrency } from '../lib/currency'

interface Transaction {
  id: string
  date: string
  type: string
  amount: number
  status: 'Completed' | 'Pending'
}

const mockTransactions: Transaction[] = []

const balanceCards = [
  { label: 'Available Balance', value: 0, icon: Wallet },
  { label: 'Invested', value: 0, icon: TrendingUp },
  { label: 'Earnings', value: 0, icon: CircleDollarSign },
  { label: 'Withdrawable Balance', value: 0, icon: ArrowDownToLine }
]

export default function WalletView() {
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-8">
          Wallet
        </h1>

        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-8 shadow-cream-lg mb-6">
          <p className="text-text-secondary text-sm mb-2">Available Balance</p>
          <p className="text-4xl md:text-5xl font-bold text-accent">{formatDualCurrency(0)}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {balanceCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                  <Icon size={20} className="text-accent" />
                </div>
                <p className="text-text-secondary text-sm mb-1">{card.label}</p>
                <p className="text-xl font-bold text-accent">
                  {formatDualCurrency(card.value)}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream-border">
                    <th className="text-left px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-4 text-text-secondary text-xs font-medium uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-border">
                  {mockTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-cream-soft/30 transition-colors">
                      <td className="px-6 py-4 text-text-primary text-sm">{tx.date}</td>
                      <td className="px-6 py-4 text-text-primary text-sm">{tx.type}</td>
                      <td className="px-6 py-4 text-text-primary text-sm font-medium">
                        {formatDualCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'Completed'
                              ? 'text-status-success bg-status-success/10'
                              : 'text-status-warning bg-status-warning/10'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mockTransactions.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-8">No wallet transactions found</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-6">
            Quick Transfer
          </h2>
          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6 md:p-8 shadow-cream max-w-2xl">
            <div className="space-y-5">
              <div>
                <label className="block text-text-secondary text-sm mb-2">From</label>
                <input
                  type="text"
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  placeholder="Enter source account"
                  className="w-full px-4 py-3 rounded-xl border border-cream-border bg-cream-secondary text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">To</label>
                <input
                  type="text"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  placeholder="Enter destination account"
                  className="w-full px-4 py-3 rounded-xl border border-cream-border bg-cream-secondary text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-cream-border bg-cream-secondary text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
                />
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors">
                <Send size={18} />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
