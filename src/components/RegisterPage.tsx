import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ChevronRight, Mail, Lock, Eye, EyeOff, Loader2, User, Users } from 'lucide-react'

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

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const urlRef = searchParams.get('ref')

  useEffect(() => {
    if (urlRef) {
      sessionStorage.setItem('prime_ref_code', urlRef)
    }
  }, [urlRef])

  const initialRefCode = urlRef || (typeof window !== 'undefined' ? sessionStorage.getItem('prime_ref_code') : '') || ''

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState(initialRefCode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await register(email, password, fullName)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Registration failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-primary flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cream-soft rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl text-text-primary mb-2">
            PRIME <span className="text-accent">NETWORK</span>
          </h1>
          <p className="text-text-secondary text-sm">Create your account and start investing</p>
        </div>

        <div className="bg-cream-card border border-cream-border rounded-cream-lg shadow-cream p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="font-display text-3xl text-text-primary mb-2">Create Your Account</h2>
            <p className="text-text-secondary text-sm">Join thousands of investors worldwide</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Username"
              type="text"
              placeholder="Choose a username"
              icon={<User size={18} />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <InputField
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              icon={<User size={18} />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <InputField
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <InputField
              label="Password"
              type="password"
              placeholder="Create a strong password"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showToggle
              showValue={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
            />

            <InputField
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              icon={<Lock size={18} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showToggle
              showValue={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Referral Code (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
                  <Users size={18} />
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PRIME-A1B2C3"
                  className="w-full pl-10 px-4 py-3 rounded-xl border border-cream-border bg-cream-card text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all uppercase font-mono font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="text-status-error text-sm bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cream-border text-center">
            <p className="text-text-secondary text-sm">
              Already have an account?{' '}
              <NavLink to="/login" className="text-accent hover:text-accent-hover font-semibold transition-colors">
                Sign In
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
