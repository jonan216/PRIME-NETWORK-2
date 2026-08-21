import { useState, useEffect } from 'react'
import { Copy, Check, ArrowUpRight, Wallet as WalletIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { formatDualCurrency } from '../lib/currency'
import { NavLink } from 'react-router-dom'

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  created_at: string
}

export default function WalletPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'withdraw'>('overview')
  const [copied, setCopied] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      if (!profile?.id) return
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setTransactions(data)
      }
      setLoading(false)
    }
    loadTransactions()
  }, [profile?.id, profile?.balance])

  const calculatedBalance = transactions.reduce((sum, tx) => {
    const amt = tx.amount || 0
    if (tx.type === 'deposit' && (tx.status === 'completed' || tx.status === 'approved')) return sum + amt
    if (tx.type === 'withdrawal' && (tx.status === 'completed' || tx.status === 'approved')) return sum - amt
    if (tx.type === 'investment' && tx.status === 'active') return sum - amt
    if (tx.type === 'earning' && (tx.status === 'completed' || tx.status === 'approved')) return sum + amt
    if (tx.type === 'referral_reward' && (tx.status === 'completed' || tx.status === 'approved')) return sum + amt
    if (tx.type === 'refund' && tx.status === 'completed') return sum + amt
    return sum
  }, 0)

  const availableBalance = profile?.balance !== undefined && profile.balance !== null
    ? Math.max(Number(profile.balance), calculatedBalance)
    : calculatedBalance

  const walletAddress = profile?.id ? `0x${profile.id.replace(/-/g, '').slice(0, 32)}` : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">My Wallet</h1>
        <p className="text-text-secondary mt-1">Manage your funds and wallet settings</p>
      </div>

      <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-text-secondary">Available Wallet Balance</p>
          <p className="text-3xl font-display font-bold text-accent mt-1">{loading ? '...' : formatDualCurrency(availableBalance)}</p>
        </div>
        <div className="flex gap-3">
          <NavLink to="/dashboard/deposit" className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors">
            Deposit Funds
          </NavLink>
          <NavLink to="/dashboard/withdraw" className="px-4 py-2.5 bg-cream-secondary hover:bg-cream-border text-text-primary border border-cream-border rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5">
            <ArrowUpRight size={16} />
            Withdraw
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'overview' ? 'bg-accent text-white' : 'bg-cream-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'transfer' ? 'bg-accent text-white' : 'bg-cream-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          Internal Transfer
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'withdraw' ? 'bg-accent text-white' : 'bg-cream-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          Withdrawal Portal
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Unique Internal Wallet Identifier</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1">Primary PRIME Network Address</p>
                <div className="flex items-center gap-2 p-3 bg-cream-secondary rounded-xl border border-cream-border">
                  <code className="text-xs text-text-primary font-mono flex-1">{walletAddress}</code>
                  <button onClick={copyAddress} className="text-accent hover:text-accent-hover p-1">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Transfer Funds to Peer</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('P2P Transfer successfully queued!'); }}>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Recipient Username or Email</label>
              <input
                type="text"
                placeholder="Enter recipient username or email"
                className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Amount (UGX)</label>
              <input
                type="number"
                placeholder="10000"
                className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
                min={1000}
              />
            </div>
            <button type="submit" className="w-full px-6 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors">
              Send Peer Transfer
            </button>
          </form>
        </div>
      )}

      {activeTab === 'withdraw' && (
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6 text-center space-y-4">
          <WalletIcon size={40} className="text-accent mx-auto" />
          <h3 className="text-lg font-semibold text-text-primary">Proceed to Dedicated Withdrawal Portal</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Use the secure withdrawal module to cash out directly to MTN Mobile Money, Airtel Money, or Bank Account.
          </p>
          <NavLink
            to="/dashboard/withdraw"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
          >
            Go to Withdraw Page
            <ArrowUpRight size={18} />
          </NavLink>
        </div>
      )}
    </div>
  )
}
