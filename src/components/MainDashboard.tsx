import { useState } from 'react'
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpRight,
  Shield,
  LogOut,
  Wallet,
  ArrowLeftRight,
  Users,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/deposit', icon: ArrowDownToLine, label: 'Deposit' },
  { to: '/dashboard/withdraw', icon: ArrowUpRight, label: 'Withdraw' },
  { to: '/dashboard/packages', icon: TrendingUp, label: 'Packages' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/dashboard/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/dashboard/team', icon: Users, label: 'My Team' },
]

// Bottom nav quick links for phones
const mobileBottomNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/dashboard/deposit', icon: ArrowDownToLine, label: 'Deposit' },
  { to: '/dashboard/withdraw', icon: ArrowUpRight, label: 'Withdraw' },
  { to: '/dashboard/packages', icon: TrendingUp, label: 'Packages' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
]

export default function MainDashboard() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { logout, profile } = useAuth()

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-cream-primary flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-nav-dark px-4 py-3 flex items-center justify-between text-cream-primary shadow-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-semibold tracking-wide">PRIME NETWORK</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-cream-primary/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-[280px] max-w-[80vw] bg-nav-dark h-full flex flex-col justify-between p-5 shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-display text-base font-semibold text-cream-primary">PRIME NETWORK</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-cream-primary/70 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map(item => {
                  const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
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
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream-primary/70 hover:bg-nav-hover transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream-primary/70 hover:bg-nav-hover transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Page Area with Responsive Paddings */}
      <main className="flex-1 md:ml-[260px] pb-20 md:pb-8">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-nav-dark border-t border-white/10 flex items-center justify-around py-2 px-1 shadow-lg">
        {mobileBottomNav.map(item => {
          const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-cream-primary/60 hover:text-cream-primary'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
