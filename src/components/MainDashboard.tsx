import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  ArrowDownToLine,
  Shield,
  LogOut,
  Wallet,
  ArrowLeftRight,
  Users,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/deposit', icon: ArrowDownToLine, label: 'New Deposit' },
  { to: '/dashboard/packages', icon: TrendingUp, label: 'My Packages' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'My Wallet' },
  { to: '/dashboard/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/dashboard/team', icon: Users, label: 'My Team' },
]

export default function MainDashboard() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-cream-primary">
      <aside className="fixed inset-y-0 left-0 z-40 w-[260px] bg-nav-dark flex flex-col">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-cream-primary">PRIME NETWORK</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-nav-active text-nav-active-text' : 'text-cream-primary/70 hover:bg-nav-hover'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem('prime_user')
              window.location.href = '/login'
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream-primary/70 hover:bg-nav-hover transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[260px]">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
