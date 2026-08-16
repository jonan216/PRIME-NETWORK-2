import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { DollarSign, TrendingUp, Wallet, Users, ArrowDownToLine, Plus, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, mapSupabaseError } from '../lib/supabaseClient'
import { formatDualCurrency } from '../lib/currency'

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  created_at: string
}

interface Investment {
  id: string
  plan_name: string
  amount: number
  daily_roi: number
  status: string
}

export default function DashboardHome() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      if (!profile?.id) return
      setLoading(true)

      const [txRes, invRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
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

    loadDashboardData()
  }, [profile?.id])

  const availableBalance = profile?.balance ?? 0
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0)

  const stats = [
    { label: 'Available Balance', value: formatDualCurrency(availableBalance), icon: Wallet, color: 'text-accent' },
    { label: 'Total Invested', value: formatDualCurrency(totalInvested), icon: TrendingUp, color: 'text-text-primary' },
    { label: 'Active Packages', value: `${investments.filter(i => i.status === 'active').length}`, icon: DollarSign, color: 'text-status-success' },
    { label: 'KYC Status', value: profile?.kyc_verified ? 'Verified' : 'Unverified', icon: Users, color: profile?.kyc_verified ? 'text-status-success' : 'text-status-warning' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">Overview</h1>
        <p className="text-text-secondary mt-1">Welcome back, {profile?.full_name || profile?.username || 'Investor'}! Here's what's happening with your account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-secondary">{stat.label}</p>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-display font-bold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-accent" size={24} /></div>
          ) : (
            <div className="space-y-4">
              {transactions.map(activity => (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-cream-secondary/50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Wallet size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary capitalize">{activity.type}</p>
                    <p className="text-xs text-text-secondary">{formatDualCurrency(activity.amount)} · Status: {activity.status}</p>
                  </div>
                  <span className="text-xs text-text-secondary flex-shrink-0">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-8">No recent activity</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <NavLink to="/dashboard/deposit" className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/20 rounded-xl hover:border-accent/40 transition-colors">
                <ArrowDownToLine size={18} className="text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Make New Deposit</p>
                  <p className="text-xs text-text-secondary">Fund your wallet</p>
                </div>
              </NavLink>
              <NavLink to="/dashboard/packages" className="flex items-center gap-3 p-4 bg-cream-secondary/50 border border-cream-border rounded-xl hover:border-accent/40 transition-colors">
                <Plus size={18} className="text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Add Package</p>
                  <p className="text-xs text-text-secondary">Start investing</p>
                </div>
              </NavLink>
              <NavLink to="/dashboard/wallet" className="flex items-center gap-3 p-4 bg-cream-secondary/50 border border-cream-border rounded-xl hover:border-accent/40 transition-colors">
                <Wallet size={18} className="text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Main Wallet</p>
                  <p className="text-xs text-text-secondary">Manage funds</p>
                </div>
              </NavLink>
            </div>
          </div>

          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Active Packages</h2>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-accent" size={20} /></div>
            ) : (
              <div className="space-y-3">
                {investments.map(pkg => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 bg-cream-secondary/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{pkg.plan_name}</p>
                      <p className="text-xs text-text-secondary">Daily ROI: {pkg.daily_roi}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-accent">{formatDualCurrency(pkg.amount)}</p>
                      <span className="text-[10px] uppercase font-semibold text-status-success">{pkg.status}</span>
                    </div>
                  </div>
                ))}
                {investments.length === 0 && (
                  <p className="text-sm text-text-secondary text-center py-4">No active investment packages</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
