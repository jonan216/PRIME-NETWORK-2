import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ChevronRight, User, Lock, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'

interface InputFieldProps {
  label: string
  type: string
  placeholder: string
  icon: React.ReactNode
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  showToggle?: boolean
  showValue?: boolean
  onToggleShow?: () => void
}

function InputField({ label, type, placeholder, icon, value, onChange, showToggle, showValue, onToggleShow }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
          {icon}
        </div>
        <input
          type={showToggle && showValue ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-cream-border bg-cream-card text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-secondary hover:text-text-primary transition-colors"
          >
            {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!identifier || !password) {
      setError('Please enter both email/username and password')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await login(identifier, password)
      if (success) {
        const cleanId = identifier.trim().toLowerCase()
        const storedUser = JSON.parse(localStorage.getItem('prime_user') || '{}')
        if (storedUser.role === 'admin' || cleanId === 'primeadministratorwealth@gmail.com' || cleanId === 'admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError('Invalid username/email or password')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-primary flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cream-soft rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 border border-cream-border/40 rounded-full" />
        <div className="absolute bottom-1/3 left-1/4 w-32 h-32 border border-accent/20 rounded-full" />

        <div className="relative z-10 max-w-lg">
          <h1 className="font-display text-5xl text-text-primary leading-tight mb-6">
            Grow Your Wealth with <span className="text-accent">Confidence</span>
          </h1>
          <p className="text-text-secondary text-lg mb-8 leading-relaxed">
            Premium investment platform with transparent returns, institutional-grade security, and personalized portfolio management.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-accent/20 border-2 border-cream-primary flex items-center justify-center">
                  <UserPlus size={16} className="text-accent" />
                </div>
              ))}
            </div>
            <p className="text-text-secondary text-sm">
              <span className="text-text-primary font-semibold">12,000+</span> investors trust Prime Network
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h2 className="font-display text-3xl text-text-primary mb-2">PRIME <span className="text-accent">NETWORK</span></h2>
            <p className="text-text-secondary text-sm">Premium Investment Platform</p>
          </div>

          <div className="bg-cream-card border border-cream-border rounded-cream-lg shadow-cream p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="font-display text-3xl text-text-primary mb-2">Welcome Back</h2>
              <p className="text-text-secondary text-sm">Sign in with your Email or Username</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Email or Username"
                type="text"
                placeholder="Enter your email or username"
                icon={<User size={18} />}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={<Lock size={18} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showToggle
                showValue={showPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
              />

              {error && (
                <div className="text-status-error text-sm bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-cream-border text-accent focus:ring-accent" />
                  <span className="text-text-secondary">Remember me</span>
                </label>
                <NavLink to="/forgot-password" className="text-accent hover:text-accent-hover transition-colors font-medium">
                  Forgot password?
                </NavLink>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-cream-border text-center">
              <p className="text-text-secondary text-sm">
                Don't have an account?{' '}
                <NavLink to="/register" className="text-accent hover:text-accent-hover font-semibold transition-colors">
                  Register
                </NavLink>
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
