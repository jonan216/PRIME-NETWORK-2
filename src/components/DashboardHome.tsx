import { NavLink } from 'react-router-dom'
import { DollarSign, TrendingUp, Wallet, Users, ArrowDownToLine, ArrowUpFromLine, Plus } from 'lucide-react'

const stats = [
  { label: 'Available Balance', value: '$4,380.00', icon: Wallet, color: 'text-accent' },
  { label: 'Total Invested', value: '$18,200.00', icon: TrendingUp, color: 'text-text-primary' },
  { label: 'Total Daily Earnings', value: '$3,850.00', icon: DollarSign, color: 'text-status-success' },
  { label: 'Referral Earnings', value: '$1,240.00', icon: Users, color: 'text-accent' },
]

const recentActivity = [
  { id: 1, title: 'Deposit Received', desc: '$2,000.00 via MTN Mobile Money', time: '2026-08-12 09:22:28', icon: ArrowDownToLine },
  { id: 2, title: 'Daily Earnings', desc: '+$58.20 from all packages', time: '2026-08-12 08:15:00', icon: TrendingUp },
  { id: 3, title: 'Withdrawal Processed', desc: '$500.00 to Bank Account', time: '2026-08-11 16:45:00', icon: ArrowUpFromLine },
  { id: 4, title: 'Referral Commission', desc: '+$120.00 from team member', time: '2026-08-11 12:30:00', icon: Users },
  { id: 5, title: 'New Investment', desc: '$2,500.00 in Premium Plan', time: '2026-08-10 14:20:00', icon: TrendingUp },
]

const activePackages = [
  { id: 1, name: 'Starter Plan', rate: '1.2% Daily', invested: 50, earned: 0.60, status: 'active' },
  { id: 2, name: 'Growth Plan', rate: '1.2% Daily', invested: 500, earned: 6.00, status: 'active' },
  { id: 3, name: 'Premium Plan', rate: '1.2% Daily', invested: 5000, earned: 60.00, status: 'active' },
]

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">Overview</h1>
        <p className="text-text-secondary mt-1">Welcome back! Here's what's happening with your account.</p>
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
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-cream-secondary/50 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <activity.icon size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{activity.title}</p>
                  <p className="text-xs text-text-secondary">{activity.desc}</p>
                </div>
                <span className="text-xs text-text-secondary flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
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
            <div className="space-y-3">
              {activePackages.map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-3 bg-cream-secondary/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{pkg.name}</p>
                    <p className="text-xs text-text-secondary">Rate: {pkg.rate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-status-success">+${pkg.earned.toFixed(2)}</p>
                    <p className="text-xs text-text-secondary">${pkg.invested.toLocaleString()} invested</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
