import { useState, useEffect } from 'react'
import { TrendingUp, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, mapSupabaseError } from '../lib/supabaseClient'
import { formatDualCurrency } from '../lib/currency'

interface Plan {
  id: string
  name: string
  roi: number
  minInvestment: number
  maxInvestment: number
  description: string
}

interface ActiveInvestment {
  id: string
  plan_name: string
  amount: number
  daily_roi: number
  created_at: string
  status: string
}

const plans: Plan[] = [
  {
    id: 'prime-daily',
    name: 'Prime Daily Earning',
    roi: 1.5,
    minInvestment: 5000,
    maxInvestment: 10000000,
    description: 'Earn 1.5% daily returns on your investment.'
  }
]

export default function InvestmentPage() {
  const { profile } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [activeInvestments, setActiveInvestments] = useState<ActiveInvestment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInvestments() {
      if (!profile?.id) return
      setLoading(true)

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setActiveInvestments(data)
      } else if (error) {
        console.error('Error loading investments:', mapSupabaseError(error))
      }
      setLoading(false)
    }

    loadInvestments()
  }, [profile?.id])

  const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const activePlansCount = activeInvestments.filter(inv => inv.status === 'active').length

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-2">
          Investment Plans
        </h1>
        <p className="text-text-secondary mb-10 max-w-2xl">
          Choose the plan that fits your financial goals. All plans come with guaranteed daily returns.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id
            return (
              <div
                key={plan.id}
                className={`relative bg-cream-card rounded-cream-lg border p-6 transition-all duration-200 ${
                  isSelected
                    ? 'border-accent shadow-cream-lg bg-cream-soft'
                    : 'border-cream-border shadow-cream hover:shadow-cream-lg hover:border-cream-border/80'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-accent text-white text-xs font-medium rounded-full">
                    Selected
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-xl font-display font-semibold text-text-primary mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-accent" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-accent">{plan.roi}%</span>
                    <span className="text-text-secondary text-sm ml-1">daily return</span>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Min Investment</span>
                    <span className="text-text-primary font-medium">{formatDualCurrency(plan.minInvestment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Max Investment</span>
                    <span className="text-text-primary font-medium">{formatDualCurrency(plan.maxInvestment)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'bg-accent/10 text-accent hover:bg-accent hover:text-white'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-display font-bold text-text-primary mb-6">
            My Active Investments
          </h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={28} /></div>
          ) : activeInvestments.length === 0 ? (
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-10 text-center">
              <TrendingUp size={40} className="text-text-secondary/40 mx-auto mb-3" />
              <p className="text-text-secondary text-sm font-medium">No active investments yet</p>
              <p className="text-text-secondary/60 text-xs mt-1">Select a plan above and make a deposit to start earning daily returns.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeInvestments.map((investment) => {
                return (
                  <div
                    key={investment.id}
                    className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-text-primary">{investment.plan_name}</h3>
                        <p className="text-text-secondary text-sm">Started {new Date(investment.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent capitalize">
                        {investment.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-text-secondary text-xs mb-1">Invested</p>
                         <p className="text-text-primary font-semibold">{formatDualCurrency(investment.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-secondary text-xs mb-1">Daily ROI</p>
                        <p className="text-status-success font-semibold">+{investment.daily_roi}% / day</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-6">
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream">
              <p className="text-text-secondary text-sm mb-1">Total Invested</p>
               <p className="text-2xl font-bold text-text-primary">{formatDualCurrency(totalInvested)}</p>
            </div>
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream">
              <p className="text-text-secondary text-sm mb-1">Active Plans</p>
               <p className="text-2xl font-bold text-text-primary">{activePlansCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
