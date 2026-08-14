import { useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, Loader2, Users } from 'lucide-react'

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
  const initialRef = searchParams.get('ref') || (typeof window !== 'undefined' ? sessionStorage.getItem('prime_ref_code') : '') || ''

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState(initialRef)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const passwordStrength = password.length > 0
    ? Math.min(100, password.length * 15 + (password.match(/[A-Z]/) ? 20 : 0) + (password.match(/[0-9]/) ? 20 : 0) + (password.match(/[^A-Za-z0-9]/) ? 20 : 0))
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
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
    <div className="min-h-screen bg-cream-primary flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cream-soft rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 border border-cream-border/30 rounded-full" />
        <div className="absolute bottom-1/3 left-1/3 w-32 h-32 border border-accent/15 rounded-full" />
      </div>

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
              label="Full Name"
              type="text"
              placeholder="John Doe"
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

            <div>
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
              {password.length > 0 && (
                <div className="mt-2 h-1 bg-cream-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              )}
            </div>

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

            <InputField
              label="Referral Code (Optional)"
              type="text"
              placeholder="e.g. PRIME-A1B2C3"
              icon={<Users size={18} />}
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            />

            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-cream-border text-accent focus:ring-accent"
              />
              <label htmlFor="terms" className="text-sm text-text-secondary cursor-pointer">
                I agree to the{' '}
                <NavLink to="/terms" className="text-accent hover:text-accent-hover font-medium">Terms of Service</NavLink>
                {' '}and{' '}
                <NavLink to="/privacy" className="text-accent hover:text-accent-hover font-medium">Privacy Policy</NavLink>
              </label>
            </div>

            {error && (
              <div className="text-status-error text-sm bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!agreeTerms || isSubmitting}
              className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Create Account
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
