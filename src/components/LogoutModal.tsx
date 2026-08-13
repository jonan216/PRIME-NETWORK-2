import { X, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const { logout } = useAuth()

  if (!isOpen) return null

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-nav-dark/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cream-card rounded-cream-lg border border-cream-border p-8 max-w-sm w-full shadow-cream-lg">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <LogOut size={20} className="text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Confirm Logout</h3>
        </div>
        <p className="text-text-secondary text-sm mb-6">
          Are you sure you want to log out of your Prime Network account?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-cream-border text-text-secondary hover:bg-cream-soft/50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2.5 rounded-xl bg-status-error text-white hover:bg-status-error/90 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
