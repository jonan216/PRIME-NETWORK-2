import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth()

  // While session is being restored, show nothing (avoid flash redirect)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-primary">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = profile?.role ?? 'user'

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (!adminOnly && role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
