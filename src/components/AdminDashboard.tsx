import { useState } from 'react'
import { Shield, Users, ArrowLeftRight, TrendingUp, CheckCircle2, XCircle, Search, Settings, BarChart3, Trash2 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  joined: string
  status: 'active' | 'pending' | 'suspended'
  invested: number
  earnings: number
}

interface Transaction {
  id: string
  user: string
  type: 'deposit' | 'withdrawal' | 'investment' | 'earning'
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  date: string
}

interface ProfitApproval {
  id: string
  user: string
  amount: number
  date: string
  status: 'pending' | 'approved' | 'rejected'
}

const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', joined: '2026-08-01', status: 'active', invested: 5000, earnings: 120 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', joined: '2026-08-03', status: 'active', invested: 10000, earnings: 240 },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', joined: '2026-08-05', status: 'pending', invested: 0, earnings: 0 },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', joined: '2026-08-06', status: 'active', invested: 2500, earnings: 60 },
]

const mockTransactions: Transaction[] = [
  { id: '1', user: 'John Doe', type: 'deposit', amount: 2000, status: 'pending', date: '2026-08-12 09:22:28' },
  { id: '2', user: 'Jane Smith', type: 'withdrawal', amount: 500, status: 'pending', date: '2026-08-12 10:15:00' },
  { id: '3', user: 'Bob Johnson', type: 'investment', amount: 1000, status: 'pending', date: '2026-08-11 14:20:00' },
  { id: '4', user: 'Alice Brown', type: 'deposit', amount: 500, status: 'approved', date: '2026-08-11 12:30:00' },
]

const mockProfits: ProfitApproval[] = [
  { id: '1', user: 'John Doe', amount: 120, date: '2026-08-12', status: 'pending' },
  { id: '2', user: 'Jane Smith', amount: 240, date: '2026-08-12', status: 'pending' },
  { id: '3', user: 'Alice Brown', amount: 60, date: '2026-08-11', status: 'approved' },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [profits, setProfits] = useState<ProfitApproval[]>(mockProfits)
  const [searchTerm, setSearchTerm] = useState('')

  const totalInvested = users.reduce((sum, u) => sum + u.invested, 0)
  const totalEarnings = users.reduce((sum, u) => sum + u.earnings, 0)
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length
  const pendingProfits = profits.filter(p => p.status === 'pending').length
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const updateUserStatus = (userId: string, status: User['status']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))
  }

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  const approveTransaction = (txId: string) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'approved' } : t))
  }

  const rejectTransaction = (txId: string) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'rejected' } : t))
  }

  const approveProfit = (profitId: string) => {
    setProfits(prev => prev.map(p => p.id === profitId ? { ...p, status: 'approved' } : p))
  }

  const rejectProfit = (profitId: string) => {
    setProfits(prev => prev.map(p => p.id === profitId ? { ...p, status: 'rejected' } : p))
  }

  return (
    <div className="flex min-h-screen bg-cream-primary">
      <aside className="fixed inset-y-0 left-0 z-40 w-[260px] bg-nav-dark flex flex-col">
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
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-nav-active text-nav-active-text' : 'text-cream-primary/70 hover:bg-nav-hover'
            }`}
          >
            <BarChart3 size={18} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-nav-active text-nav-active-text' : 'text-cream-primary/70 hover:bg-nav-hover'
            }`}
          >
            <Users size={18} />
            Users
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'transactions' ? 'bg-nav-active text-nav-active-text' : 'text-cream-primary/70 hover:bg-nav-hover'
            }`}
          >
            <ArrowLeftRight size={18} />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('profits')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'profits' ? 'bg-nav-active text-nav-active-text' : 'text-cream-primary/70 hover:bg-nav-hover'
            }`}
          >
            <TrendingUp size={18} />
            Profit Approval
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-nav-active text-nav-active-text' : 'text-cream-primary/70 hover:bg-nav-hover'
            }`}
          >
            <Settings size={18} />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-cream-primary/50 text-center">Admin Panel</p>
        </div>
      </aside>

      <main className="flex-1 ml-[260px] p-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">Admin Dashboard</h1>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <p className="text-sm text-text-secondary mb-1">Total Users</p>
                <p className="text-3xl font-display font-semibold text-text-primary">{totalUsers}</p>
                <p className="text-xs text-text-secondary mt-1">{activeUsers} active</p>
              </div>
              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <p className="text-sm text-text-secondary mb-1">Total Invested</p>
                <p className="text-3xl font-display font-semibold text-accent">${totalInvested.toLocaleString()}</p>
              </div>
              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <p className="text-sm text-text-secondary mb-1">Total Earnings Paid</p>
                <p className="text-3xl font-display font-semibold text-status-success">${totalEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <p className="text-sm text-text-secondary mb-1">Pending Actions</p>
                <p className="text-3xl font-display font-semibold text-status-warning">{pendingTransactions + pendingProfits}</p>
                <p className="text-xs text-text-secondary mt-1">{pendingTransactions} transactions, {pendingProfits} profits</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Users</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cream-border">
                        <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Name</th>
                        <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Email</th>
                        <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                        <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Invested</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border">
                      {filteredUsers.slice(0, 5).map(user => (
                        <tr key={user.id}>
                          <td className="py-3 text-sm text-text-primary">{user.name}</td>
                          <td className="py-3 text-sm text-text-secondary">{user.email}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'active' ? 'bg-status-success/10 text-status-success' :
                              user.status === 'pending' ? 'bg-status-warning/10 text-status-warning' :
                              'bg-status-error/10 text-status-error'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-text-primary">${user.invested.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Pending Transactions</h2>
                <div className="space-y-3">
                  {transactions.filter(t => t.status === 'pending').slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-cream-secondary/50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{tx.user}</p>
                        <p className="text-xs text-text-secondary">{tx.type} - ${tx.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveTransaction(tx.id)}
                          className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => rejectTransaction(tx.id)}
                          className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {transactions.filter(t => t.status === 'pending').length === 0 && (
                    <p className="text-sm text-text-secondary text-center py-4">No pending transactions</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">User Management</h2>
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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-border">
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Name</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Email</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Joined</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Invested</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Earnings</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td className="py-4 text-sm font-medium text-text-primary">{user.name}</td>
                        <td className="py-4 text-sm text-text-secondary">{user.email}</td>
                        <td className="py-4 text-sm text-text-secondary">{user.joined}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-status-success/10 text-status-success' :
                            user.status === 'pending' ? 'bg-status-warning/10 text-status-warning' :
                            'bg-status-error/10 text-status-error'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-text-primary">${user.invested.toLocaleString()}</td>
                        <td className="py-4 text-sm text-status-success">${user.earnings.toLocaleString()}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {user.status === 'pending' && (
                              <button
                                onClick={() => updateUserStatus(user.id, 'active')}
                                className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            {user.status === 'active' && (
                              <button
                                onClick={() => updateUserStatus(user.id, 'suspended')}
                                className="p-1.5 rounded-lg bg-status-warning/10 text-status-warning hover:bg-status-warning/20 transition-colors"
                                title="Suspend"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            {user.status === 'suspended' && (
                              <button
                                onClick={() => updateUserStatus(user.id, 'active')}
                                className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors"
                                title="Reactivate"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                                  deleteUser(user.id)
                                }
                              }}
                              className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Transaction Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-border">
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">User</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Type</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Amount</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Date</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {transactions.map(tx => (
                      <tr key={tx.id}>
                        <td className="py-4 text-sm font-medium text-text-primary">{tx.user}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.type === 'deposit' ? 'bg-status-success/10 text-status-success' :
                            tx.type === 'withdrawal' ? 'bg-status-error/10 text-status-error' :
                            'bg-accent/10 text-accent'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-text-primary">${tx.amount.toLocaleString()}</td>
                        <td className="py-4 text-sm text-text-secondary">{tx.date}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'approved' ? 'bg-status-success/10 text-status-success' :
                            tx.status === 'rejected' ? 'bg-status-error/10 text-status-error' :
                            'bg-status-warning/10 text-status-warning'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4">
                          {(tx.status === 'pending' || tx.status === 'approved') && (
                            <div className="flex items-center gap-2">
                              {tx.status === 'pending' && (
                                <button
                                  onClick={() => approveTransaction(tx.id)}
                                  className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => rejectTransaction(tx.id)}
                                className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profits' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Profit Approval</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-border">
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">User</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Amount</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Date</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                      <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {profits.map(profit => (
                      <tr key={profit.id}>
                        <td className="py-4 text-sm font-medium text-text-primary">{profit.user}</td>
                        <td className="py-4 text-sm text-status-success">${profit.amount.toLocaleString()}</td>
                        <td className="py-4 text-sm text-text-secondary">{profit.date}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            profit.status === 'approved' ? 'bg-status-success/10 text-status-success' :
                            profit.status === 'rejected' ? 'bg-status-error/10 text-status-error' :
                            'bg-status-warning/10 text-status-warning'
                          }`}>
                            {profit.status}
                          </span>
                        </td>
                        <td className="py-4">
                          {(profit.status === 'pending' || profit.status === 'approved') && (
                            <div className="flex items-center gap-2">
                              {profit.status === 'pending' && (
                                <button
                                  onClick={() => approveProfit(profit.id)}
                                  className="p-1.5 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => rejectProfit(profit.id)}
                                className="p-1.5 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">System Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Daily Earnings Rate (%)</label>
                  <input
                    type="number"
                    defaultValue="1.2"
                    className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Referral Commission - Level 1 (%)</label>
                  <input
                    type="number"
                    defaultValue="5"
                    className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Referral Commission - Level 2 (%)</label>
                  <input
                    type="number"
                    defaultValue="3"
                    className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Referral Commission - Level 3 (%)</label>
                  <input
                    type="number"
                    defaultValue="1"
                    className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Minimum Deposit ($)</label>
                  <input
                    type="number"
                    defaultValue="5"
                    className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Minimum Withdrawal ($)</label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
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