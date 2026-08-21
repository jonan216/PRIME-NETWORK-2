import { useState, useEffect, useCallback } from 'react'
import { Shield, Users, ArrowLeftRight, TrendingUp, CheckCircle2, XCircle, Search, Settings, BarChart3, Trash2, RefreshCw, Loader2, Bell } from 'lucide-react'
import { supabase, mapSupabaseError } from '../lib/supabaseClient'
import { formatDualCurrency } from '../lib/currency'

interface Profile {
  id: string
  full_name: string
  username: string
  email: string
  role: string
  status: string
  balance: number
  kyc_verified: boolean
  created_at: string
  totalDeposits?: number
  totalWithdrawals?: number
  totalEarnings?: number
  totalInvestments?: number
  activeInvestmentAmount?: number
  transactionCount?: number
  investmentCount?: number
}

interface Transaction {
  id: string
  user_id: string
  type: string
  amount: number
  status: string
  provider: string | null
  reference: string | null
  created_at: string
  profiles?: { full_name: string; email: string }
}

interface Investment {
  id: string
  user_id: string
  plan_name: string
  amount: number
  daily_roi: number
  status: string
  created_at: string
  last_earning_at: string | null
  profiles?: { full_name: string; email: string }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<Profile[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(false)
  const [invLoading, setInvLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const [depositFilter, setDepositFilter] = useState<'all' | 'completed' | 'pending' | 'rejected'>('all')

  // ─── Data loaders ─────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    
    // 1. Try get_admin_users_summary RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_users_summary')

    if (!rpcErr && rpcData) {
      const mapped = rpcData.map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        balance: Number(u.balance || 0),
        kyc_verified: u.kyc_verified,
        created_at: u.created_at,
        referral_code: u.referral_code,
        referred_by: u.referred_by,
        totalDeposits: Number(u.total_deposits || 0),
        totalWithdrawals: Number(u.total_withdrawals || 0),
        totalEarnings: Number(u.total_earnings || 0),
        totalInvestments: Number(u.total_investments || 0),
        activeInvestmentAmount: Number(u.active_investments || 0),
      }))
      setUsers(mapped)
      setUsersLoading(false)
      return
    }

    // 2. Fallback: Query profiles + calculate aggregates dynamically
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users:', mapSupabaseError(error))
      setUsersLoading(false)
      return
    }

    const { data: allTx } = await supabase.from('transactions').select('*')
    const { data: allInv } = await supabase.from('investments').select('*')

    const successStatuses = ['completed', 'approved', 'credited', 'successful', 'success', 'paid', 'sandbox']

    const mappedUsers = (profiles as Profile[]).map(u => {
      const uTxs = (allTx || []).filter(t => t.user_id === u.id)
      const uInvs = (allInv || []).filter(i => i.user_id === u.id)

      const totalDep = uTxs
        .filter(t => t.type === 'deposit' && successStatuses.includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

      const totalWith = uTxs
        .filter(t => t.type === 'withdrawal' && ['completed', 'approved'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

      const totalEarn = uTxs
        .filter(t => ['earning', 'referral_reward', 'bonus'].includes(t.type) && ['completed', 'approved'].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

      const activeInv = uInvs
        .filter(i => i.status === 'active')
        .reduce((sum, i) => sum + Number(i.amount || 0), 0)

      return {
        ...u,
        balance: Number(u.balance || 0),
        totalDeposits: totalDep,
        totalWithdrawals: totalWith,
        totalEarnings: totalEarn,
        activeInvestmentAmount: activeInv
      }
    })

    setUsers(mappedUsers)
    setUsersLoading(false)
  }, [])

  const loadTransactions = useCallback(async () => {
    setTxLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error loading transactions:', mapSupabaseError(error))
    } else if (data) {
      setTransactions(data as Transaction[])
    }
    setTxLoading(false)
  }, [])

  const loadInvestments = useCallback(async () => {
    setInvLoading(true)
    const { data, error } = await supabase
      .from('investments')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error loading investments:', mapSupabaseError(error))
    } else if (data) {
      setInvestments(data as Investment[])
    }
    setInvLoading(false)
  }, [])

  // Load on mount and on tab change
  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => { loadTransactions() }, [loadTransactions])
  useEffect(() => {
    if (activeTab === 'deposits' || activeTab === 'transactions') {
      loadTransactions()
    }
  }, [activeTab, loadTransactions])
  useEffect(() => {
    if (activeTab === 'investments') {
      loadInvestments()
    }
  }, [activeTab, loadInvestments])

  // Real-time notification for new deposits
  useEffect(() => {
    const channel = supabase
      .channel('admin-deposit-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: "type=eq.deposit"
      }, (payload) => {
        const newTx = payload.new as Transaction
        if (newTx.status === 'pending' || newTx.status === 'pending_approval') {
          setNotification(`New deposit of ${formatDualCurrency(newTx.amount)} from a user needs approval`)
          setTransactions(prev => [newTx, ...prev])
           setActiveTab('deposits')
          setTimeout(() => setNotification(null), 5000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ─── Actions ──────────────────────────────────────────────────
  const updateUserStatus = async (userId: string, status: string) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
    if (error) {
      console.error('Error updating user status:', mapSupabaseError(error))
      return
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))
  }

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) {
      console.error('Error deleting user:', mapSupabaseError(error))
      return
    }
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  const approveTransaction = async (txId: string, type: string) => {
    if (type === 'withdrawal') {
      const { data: tx } = await supabase
        .from('transactions')
        .select('amount, user_id')
        .eq('id', txId)
        .single()

      if (tx) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', tx.user_id)
          .single()

        if (profile && (profile.balance || 0) >= (tx.amount || 0)) {
          await supabase
            .from('profiles')
            .update({ balance: (profile.balance || 0) - (tx.amount || 0) })
            .eq('id', tx.user_id)
        } else {
          alert('Insufficient balance for this withdrawal.')
          return
        }
      }
    }

    const { error } = await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId)
    if (error) {
      console.error('Error approving transaction:', mapSupabaseError(error))
      return
    }
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'approved' } : t))
  }

  const rejectTransaction = async (txId: string) => {
    const { error } = await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txId)
    if (error) {
      console.error('Error rejecting transaction:', mapSupabaseError(error))
      return
    }
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'rejected' } : t))
  }

  const cancelInvestment = async (invId: string) => {
    if (!window.confirm('Cancel this investment and refund the user? This will return the invested amount to the user balance.')) return

    const { data: investment } = await supabase.from('investments').select('*').eq('id', invId).single()
    if (!investment || investment.status !== 'active') {
      alert('Investment not found or already cancelled.')
      return
    }

    const { error: cancelError } = await supabase.from('investments').update({ status: 'cancelled' }).eq('id', invId)
    if (cancelError) {
      console.error('Error cancelling investment:', mapSupabaseError(cancelError))
      alert('Failed to cancel investment.')
      return
    }

    try {
      await supabase.rpc('increment_balance', { p_user_id: investment.user_id, p_amount: investment.amount })
    } catch (err) {
      console.error('Refund error:', err)
    }
    try {
      await supabase.from('transactions').insert({
        user_id: investment.user_id,
        type: 'refund',
        amount: investment.amount,
        status: 'completed',
        provider: null,
        reference: `REFUND-${invId}`,
      })
    } catch (err) {
      console.error('Refund tx error:', err)
    }

    setInvestments(prev => prev.map(i => i.id === invId ? { ...i, status: 'cancelled' } : i))
    loadUsers()
  }

  const reconcileUserBalance = async (userId: string) => {
    const { data, error } = await supabase.rpc('recalculate_balance', { p_user_id: userId })
    if (error) {
      console.error('Error reconciling balance:', mapSupabaseError(error))
      alert('Failed to reconcile balance: ' + mapSupabaseError(error))
      return
    }
    alert(`Balance reconciled successfully. New balance: ${formatDualCurrency(data || 0)}`)
    loadUsers()
    loadTransactions()
  }

  const reconcileAllBalances = async () => {
    if (!window.confirm('This will recalculate ALL user balances from their transaction history. Continue?')) return
    const { error } = await supabase.rpc('recalculate_all_balances')
    if (error) {
      console.error('Error reconciling all balances:', mapSupabaseError(error))
      alert('Failed to reconcile balances: ' + mapSupabaseError(error))
      return
    }
    alert('All balances reconciled successfully.')
    loadUsers()
    loadTransactions()
  }

  const syncPendingDeposits = async () => {
    if (!window.confirm('This will check all pending deposits and withdrawals against Marz Innovations and update their status. Continue?')) return
    setTxLoading(true)
    try {
      const res = await fetch('/api/marz/sync', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        alert(`Sync complete. ${data.synced || 0} transactions updated out of ${data.total || 0} pending.`)
      } else {
        alert('Failed to sync with Marz.')
      }
      loadTransactions()
    } catch (err) {
      console.error('Error syncing:', err)
      alert('Failed to sync.')
    }
    setTxLoading(false)
  }

  const silentSync = async () => {
    try {
      await fetch('/api/marz/sync', { method: 'POST' })
      loadTransactions()
    } catch {
      // silent fail for background sync
    }
  }

  // Auto-sync pending transactions every 30 seconds when on deposits tab
  useEffect(() => {
    if (activeTab !== 'deposits') return
    const interval = setInterval(() => {
      silentSync()
    }, 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  // ─── Derived stats ────────────────────────────────────────────
  const nonAdminUsers = users.filter(u => u.role !== 'admin')
  const activeUsers = nonAdminUsers.filter(u => u.status === 'active').length
  const pendingTx = transactions.filter(t => t.status === 'pending' || t.status === 'pending_approval').length
  const totalBalance = nonAdminUsers.reduce((s, u) => s + (u.balance || 0), 0)

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingTransactions = transactions.filter(t => t.status === 'pending' || t.status === 'pending_approval')
  const pendingDeposits = transactions.filter(t => t.type === 'deposit')
  const pendingDepositsCount = pendingDeposits.filter(t => t.status === 'pending' || t.status === 'pending_approval').length

  // ─── Shared status badge ──────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'active' || status === 'approved' || status === 'completed' ? 'bg-status-success/10 text-status-success' :
      status === 'pending' || status === 'pending_approval' ? 'bg-status-warning/10 text-status-warning' :
      'bg-status-error/10 text-status-error'
    }`}>
      {status}
    </span>
  )

  // ─── Sidebar nav items ────────────────────────────────────────
  const navItems = [
    { id: 'overview', label: 'Overview', Icon: BarChart3 },
    { id: 'users', label: 'Users', Icon: Users },
    { id: 'transactions', label: 'Transactions', Icon: ArrowLeftRight },
    { id: 'investments', label: 'Investments', Icon: TrendingUp },
    { id: 'deposits', label: 'Deposits', Icon: CheckCircle2, badge: pendingDepositsCount },
    { id: 'kyc', label: 'KYC Approvals', Icon: Shield },
    { id: 'profits', label: 'Profit Approval', Icon: TrendingUp },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ]

  const NavButton = ({ id, label, Icon, badge }: { id: string; label: string; Icon: React.ElementType; badge?: number }) => (
    <button
      onClick={() => { setActiveTab(id); setMobileMenuOpen(false) }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
        activeTab === id ? 'bg-nav-active text-nav-active-text' : 'text-cream-primary/70 hover:bg-nav-hover'
      }`}
    >
      <div className="relative">
        <Icon size={18} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1.5 bg-status-error text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-cream-primary flex flex-col md:flex-row">

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-nav-dark px-4 py-3 flex items-center justify-between text-cream-primary shadow-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-semibold">ADMIN PANEL</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-cream-primary/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          {mobileMenuOpen ? <XCircle size={22} /> : <BarChart3 size={22} />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-[280px] max-w-[80vw] bg-nav-dark h-full flex flex-col p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <span className="font-display text-base font-semibold text-cream-primary">ADMIN MENU</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-cream-primary/70 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map(n => <NavButton key={n.id} {...n} />)}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[260px] bg-nav-dark flex-col">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-cream-primary">PRIME NETWORK</span>
        </div>
        <div className="px-4 pb-2">
          <p className="text-xs text-cream-primary/50 uppercase tracking-wider">Administrator</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(n => <NavButton key={n.id} {...n} />)}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-cream-primary/50 text-center">Admin Panel · Supabase Live</p>
        </div>
      </aside>

      <main className="flex-1 md:ml-[260px] p-4 sm:p-6 md:p-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">Admin Dashboard</h1>

        {notification && (
          <div className="mb-6 p-4 bg-status-warning/10 border border-status-warning/20 rounded-xl flex items-center gap-3 animate-pulse">
            <Bell size={20} className="text-status-warning" />
            <p className="text-sm font-medium text-text-primary">{notification}</p>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (() => {
          const totalCompletedDepositsSum = transactions
            .filter(t => t.type === 'deposit' && ['completed', 'approved', 'credited', 'successful', 'success', 'paid', 'sandbox'].includes(t.status))
            .reduce((s, t) => s + (t.amount || 0), 0)

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                  <p className="text-sm text-text-secondary mb-1">Total Users</p>
                  <p className="text-3xl font-display font-semibold text-text-primary">{nonAdminUsers.length}</p>
                  <p className="text-xs text-text-secondary mt-1">{activeUsers} active</p>
                </div>
                <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                  <p className="text-sm text-text-secondary mb-1">Combined Balance</p>
                  <p className="text-3xl font-display font-semibold text-accent">
                    {formatDualCurrency(totalBalance)}
                  </p>
                </div>
                <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                  <p className="text-sm text-text-secondary mb-1">Total Completed Deposits</p>
                  <p className="text-3xl font-display font-semibold text-status-success">
                    {formatDualCurrency(totalCompletedDepositsSum)}
                  </p>
                </div>
                <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                  <p className="text-sm text-text-secondary mb-1">Pending Actions</p>
                  <p className="text-3xl font-display font-semibold text-status-warning">{pendingTx}</p>
                  <p className="text-xs text-text-secondary mt-1">transactions awaiting review</p>
                </div>
                <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">Balance Reconciliation</p>
                    <p className="text-xs text-text-secondary mt-1">Recalculate all user balances from transaction history</p>
                  </div>
                  <button
                    onClick={reconcileAllBalances}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <RefreshCw size={16} />
                    Reconcile All Balances
                  </button>
                </div>
              </div>

            {pendingDeposits.length > 0 && (
              <div className="bg-cream-card rounded-cream-lg border border-status-warning/30 p-6">
                <div className="flex items-center justify-between mb-4">
                     <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                     <Bell size={20} className="text-status-success" />
                     Recent Deposits
                   </h2>
                  <button
                    onClick={() => setActiveTab('deposits')}
                    className="text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingDeposits.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-cream-secondary/50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{tx.profiles?.full_name || tx.profiles?.email || '—'}</p>
                        <p className="text-xs text-text-secondary">{formatDualCurrency(tx.amount)} · {new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => approveTransaction(tx.id, tx.type)} className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20" title="Approve">
                          <CheckCircle2 size={16} />
                        </button>
                        <button onClick={() => rejectTransaction(tx.id)} className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20" title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Recent Users</h2>
                  <button onClick={loadUsers} className="text-accent hover:text-accent-hover">
                    <RefreshCw size={16} />
                  </button>
                </div>
                {usersLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-accent" size={24} /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-cream-border">
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Name</th>
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Email</th>
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-border">
                        {nonAdminUsers.slice(0, 5).map(u => (
                          <tr key={u.id}>
                            <td className="py-3 text-sm text-text-primary font-medium">{u.full_name || u.username}</td>
                            <td className="py-3 text-sm text-text-secondary">{u.email}</td>
                            <td className="py-3"><StatusBadge status={u.status} /></td>
                          </tr>
                        ))}
                        {nonAdminUsers.length === 0 && (
                          <tr><td colSpan={3} className="py-6 text-center text-sm text-text-secondary">No users registered yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Pending Transactions</h2>
                <div className="space-y-3">
                  {pendingTransactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-cream-secondary/50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {tx.profiles?.full_name || tx.profiles?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-text-secondary">{tx.type} · {formatDualCurrency(tx.amount)}</p>
                      </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => approveTransaction(tx.id, tx.type)} className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20">
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => rejectTransaction(tx.id)} className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20">
                            <XCircle size={16} />
                          </button>
                        </div>
                    </div>
                  ))}
                  {pendingTransactions.length === 0 && (
                    <p className="text-sm text-text-secondary text-center py-4">No pending transactions</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )})()}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h2 className="text-lg font-semibold text-text-primary">User Management</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <button
                    onClick={loadUsers}
                    className="p-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
                    title="Refresh users from Supabase"
                  >
                    {usersLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  </button>
                </div>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={28} /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cream-border">
                        {['Name', 'Username', 'Email', 'Role', 'Joined', 'Status', 'Balance', 'Deposits', 'Withdrawals', 'Earnings', 'Investments', 'Actions'].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3 pr-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border">
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td className="py-4 text-sm font-medium text-text-primary pr-4 whitespace-nowrap">{u.full_name || '—'}</td>
                          <td className="py-4 text-sm text-text-secondary pr-4">@{u.username || '—'}</td>
                          <td className="py-4 text-sm text-text-secondary pr-4">{u.email}</td>
                          <td className="py-4 pr-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-cream-secondary text-text-secondary'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-text-secondary pr-4 whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 pr-4"><StatusBadge status={u.status} /></td>
                          <td className="py-4 text-sm text-text-primary pr-4 whitespace-nowrap">{formatDualCurrency(u.balance || 0)}</td>
                          <td className="py-4 text-sm text-status-success pr-4 whitespace-nowrap">{formatDualCurrency(u.totalDeposits || 0)}</td>
                          <td className="py-4 text-sm text-status-error pr-4 whitespace-nowrap">{formatDualCurrency(u.totalWithdrawals || 0)}</td>
                          <td className="py-4 text-sm text-accent pr-4 whitespace-nowrap">{formatDualCurrency(u.totalEarnings || 0)}</td>
                          <td className="py-4 text-sm text-text-primary pr-4 whitespace-nowrap">{formatDualCurrency(u.activeInvestmentAmount || 0)}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              {u.status === 'active' && u.role !== 'admin' && (
                                <button
                                  onClick={() => updateUserStatus(u.id, 'suspended')}
                                  className="p-1.5 rounded-lg bg-status-warning/10 text-status-warning hover:bg-status-warning/20 transition-colors"
                                  title="Suspend"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                              {u.status === 'suspended' && (
                                <button
                                  onClick={() => updateUserStatus(u.id, 'active')}
                                  className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors"
                                  title="Reactivate"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => reconcileUserBalance(u.id)}
                                  className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                                  title="Reconcile Balance"
                                >
                                  <RefreshCw size={16} />
                                </button>
                              )}
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete ${u.full_name || u.email}? This cannot be undone.`)) {
                                      deleteUser(u.id)
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={12} className="py-10 text-center text-text-secondary text-sm">
                            {searchTerm ? 'No users match your search' : 'No users registered yet'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS ── */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Transaction Management</h2>
                <button onClick={loadTransactions} className="p-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent transition-colors">
                  {txLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                </button>
              </div>
              {txLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={28} /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cream-border">
                        {['User', 'Type', 'Amount', 'Provider', 'Date', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border">
                      {transactions.map(tx => (
                        <tr key={tx.id}>
                          <td className="py-4 text-sm font-medium text-text-primary pr-4 whitespace-nowrap">
                            {tx.profiles?.full_name || tx.profiles?.email || '—'}
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              tx.type === 'deposit' ? 'bg-status-success/10 text-status-success' :
                              tx.type === 'withdrawal' ? 'bg-status-error/10 text-status-error' :
                              'bg-accent/10 text-accent'
                            }`}>{tx.type}</span>
                          </td>
                          <td className="py-4 text-sm text-text-primary pr-4">{formatDualCurrency(tx.amount)}</td>
                          <td className="py-4 text-sm text-text-secondary pr-4">{tx.provider || '—'}</td>
                          <td className="py-4 text-sm text-text-secondary pr-4 whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 pr-4"><StatusBadge status={tx.status} /></td>
                          <td className="py-4">
                            {tx.type === 'withdrawal' && tx.status !== 'cancelled' && tx.status !== 'rejected' && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => approveTransaction(tx.id, tx.type)} className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20" title="Approve">
                                  <CheckCircle2 size={16} />
                                </button>
                                <button onClick={() => rejectTransaction(tx.id)} className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20" title="Reject">
                                  <XCircle size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr><td colSpan={7} className="py-10 text-center text-sm text-text-secondary">No transactions in the system yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DEPOSITS ── */}
        {activeTab === 'deposits' && (() => {
          const allDeposits = transactions.filter(t => t.type === 'deposit')
          const completedDeps = allDeposits.filter(t => ['completed', 'approved', 'credited', 'successful', 'success', 'paid', 'sandbox'].includes(t.status))
          const pendingDeps = allDeposits.filter(t => ['pending', 'pending_approval'].includes(t.status))
          const rejectedDeps = allDeposits.filter(t => t.status === 'rejected')

          const totalCompletedVol = completedDeps.reduce((sum, t) => sum + Number(t.amount || 0), 0)

          const displayedDeposits = depositFilter === 'completed' ? completedDeps :
                                    depositFilter === 'pending' ? pendingDeps :
                                    depositFilter === 'rejected' ? rejectedDeps : allDeposits

          return (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5">
                  <p className="text-sm text-text-secondary mb-1">Total Completed Deposits</p>
                  <p className="text-2xl font-display font-semibold text-status-success">
                    {formatDualCurrency(totalCompletedVol)}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">{completedDeps.length} successful transactions</p>
                </div>
                <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5">
                  <p className="text-sm text-text-secondary mb-1">Completed Deposits Count</p>
                  <p className="text-2xl font-display font-semibold text-text-primary">
                    {completedDeps.length}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">out of {allDeposits.length} total deposit requests</p>
                </div>
                <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5">
                  <p className="text-sm text-text-secondary mb-1">Pending Approval</p>
                  <p className="text-2xl font-display font-semibold text-status-warning">
                    {pendingDeps.length}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">awaiting confirmation</p>
                </div>
              </div>

              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Deposit Transactions</h2>
                    <p className="text-xs text-text-secondary">View and audit all user deposit history</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={syncPendingDeposits} className="px-3 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors flex items-center gap-1.5" title="Sync pending deposits with Marz">
                      {txLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Sync Pending
                    </button>
                    <button onClick={loadTransactions} className="p-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent transition-colors" title="Refresh">
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>

                {/* Sub-tab Filter Bar */}
                <div className="flex items-center gap-2 mb-6 border-b border-cream-border pb-3 overflow-x-auto">
                  {[
                    { key: 'all', label: 'All Deposits', count: allDeposits.length },
                    { key: 'completed', label: 'Completed', count: completedDeps.length },
                    { key: 'pending', label: 'Pending', count: pendingDeps.length },
                    { key: 'rejected', label: 'Rejected', count: rejectedDeps.length },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setDepositFilter(tab.key as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                        depositFilter === tab.key
                          ? 'bg-accent text-white font-semibold shadow-sm'
                          : 'bg-cream-secondary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tab.label}
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        depositFilter === tab.key ? 'bg-white/20 text-white' : 'bg-black/10 text-text-secondary'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {txLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={28} /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-cream-border">
                          {['User', 'Amount', 'Provider', 'Reference', 'Date', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-border">
                        {displayedDeposits.map(tx => (
                          <tr key={tx.id}>
                            <td className="py-4 text-sm font-medium text-text-primary pr-4 whitespace-nowrap">
                              {tx.profiles?.full_name || tx.profiles?.email || '—'}
                            </td>
                            <td className="py-4 text-sm font-semibold text-text-primary pr-4">{formatDualCurrency(tx.amount)}</td>
                            <td className="py-4 text-sm text-text-secondary pr-4">{tx.provider || 'MarzPay'}</td>
                            <td className="py-4 text-sm text-text-secondary pr-4 whitespace-nowrap font-mono text-xs">
                              {tx.reference || '—'}
                            </td>
                            <td className="py-4 text-sm text-text-secondary pr-4 whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-4 pr-4"><StatusBadge status={tx.status} /></td>
                            <td className="py-4">
                              {(tx.status === 'pending' || tx.status === 'pending_approval') && (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => approveTransaction(tx.id, tx.type)} className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20" title="Approve Deposit">
                                    <CheckCircle2 size={16} />
                                  </button>
                                  <button onClick={() => rejectTransaction(tx.id)} className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20" title="Reject Deposit">
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {displayedDeposits.length === 0 && (
                          <tr><td colSpan={7} className="py-10 text-center text-sm text-text-secondary">No deposits matching this filter</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── INVESTMENTS ── */}
        {activeTab === 'investments' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Investment Management</h2>
                <div className="flex items-center gap-2">
                  <button onClick={loadInvestments} className="p-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent transition-colors">
                    {invLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  </button>
                  <button onClick={async () => {
                    if (!window.confirm('CANCEL ALL investments, refund users, remove fake packages, and reset balances? This will set Total Invested to 0.')) return
                    const token = (await supabase.auth.getSession()).data.session?.access_token
                    const res = await fetch('/api/admin/cleanup/reset-all', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                    })
                    const json = await res.json()
                    alert(json.message || JSON.stringify(json))
                    loadInvestments()
                    loadUsers()
                    loadTransactions()
                  }} className="p-2 rounded-xl bg-status-error/10 hover:bg-status-error/20 text-status-error transition-colors" title="Cancel all investments and reset to clean state">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {invLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={28} /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cream-border">
                        {['User', 'Plan', 'Amount', 'Daily ROI', 'Started', 'Last Earning', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3 pr-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border">
                      {investments.map(inv => (
                        <tr key={inv.id}>
                          <td className="py-4 text-sm font-medium text-text-primary pr-4 whitespace-nowrap">
                            {inv.profiles?.full_name || inv.profiles?.email || '—'}
                          </td>
                          <td className="py-4 text-sm text-text-secondary pr-4">{inv.plan_name}</td>
                          <td className="py-4 text-sm text-text-primary pr-4">{formatDualCurrency(inv.amount)}</td>
                          <td className="py-4 text-sm text-accent pr-4">{inv.daily_roi}%</td>
                          <td className="py-4 text-sm text-text-secondary pr-4 whitespace-nowrap">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-sm text-text-secondary pr-4 whitespace-nowrap">
                            {inv.last_earning_at ? new Date(inv.last_earning_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-4 pr-4"><StatusBadge status={inv.status} /></td>
                          <td className="py-4">
                            {inv.status === 'active' && (
                              <button
                                onClick={() => cancelInvestment(inv.id)}
                                className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
                                title="Cancel Investment & Refund"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {investments.length === 0 && (
                        <tr><td colSpan={8} className="py-10 text-center text-sm text-text-secondary">No investments in the system yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── KYC APPROVALS ── */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">KYC Verifications</h2>
                <button onClick={loadUsers} className="p-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent transition-colors">
                  {usersLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                </button>
              </div>
              {usersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={28} /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cream-border">
                        {['User', 'Email', 'Username', 'KYC Status', 'Actions'].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border">
                      {users.filter(u => u.role !== 'admin').map(u => (
                        <tr key={u.id}>
                          <td className="py-4 text-sm font-medium text-text-primary pr-4 whitespace-nowrap">
                            {u.full_name || '—'}
                          </td>
                          <td className="py-4 text-sm text-text-secondary pr-4">{u.email}</td>
                          <td className="py-4 text-sm text-text-secondary pr-4">@{u.username}</td>
                          <td className="py-4 pr-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.kyc_verified ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'
                            }`}>
                              {u.kyc_verified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              {!u.kyc_verified ? (
                                <button
                                  onClick={async () => {
                                    await supabase.from('profiles').update({ kyc_verified: true }).eq('id', u.id)
                                    setUsers(prev => prev.map(user => user.id === u.id ? { ...user, kyc_verified: true } : user))
                                  }}
                                  className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20"
                                  title="Approve KYC"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    await supabase.from('profiles').update({ kyc_verified: false }).eq('id', u.id)
                                    setUsers(prev => prev.map(user => user.id === u.id ? { ...user, kyc_verified: false } : user))
                                  }}
                                  className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20"
                                  title="Reject KYC"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.role !== 'admin').length === 0 && (
                        <tr><td colSpan={5} className="py-10 text-center text-sm text-text-secondary">No users registered yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROFITS ── */}
        {activeTab === 'profits' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Pending Profit Approvals</h2>
              <div className="space-y-3">
                {pendingTransactions.filter(t => t.type === 'earning').map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-cream-secondary/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{tx.profiles?.full_name || tx.profiles?.email || '—'}</p>
                       <p className="text-xs text-text-secondary">{formatDualCurrency(tx.amount)} · {new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => approveTransaction(tx.id, tx.type)} className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20" title="Approve">
                        <CheckCircle2 size={16} />
                      </button>
                      <button onClick={() => rejectTransaction(tx.id)} className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20" title="Reject">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {pendingTransactions.filter(t => t.type === 'earning').length === 0 && (
                  <p className="text-sm text-text-secondary text-center py-6">No profit approvals pending</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">System Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'Daily Earnings Rate (%)', defaultValue: '1.2' },
                  { label: 'Referral Commission - Level 1 (%)', defaultValue: '5' },
                  { label: 'Referral Commission - Level 2 (%)', defaultValue: '3' },
                  { label: 'Referral Commission - Level 3 (%)', defaultValue: '1' },
                  { label: 'Minimum Deposit (UGX)', defaultValue: '5000' },
                  { label: 'Minimum Withdrawal (UGX)', defaultValue: '10000' },
                ].map(({ label, defaultValue }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
                    <input
                      type="number"
                      defaultValue={defaultValue}
                      className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                ))}
                <button className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}