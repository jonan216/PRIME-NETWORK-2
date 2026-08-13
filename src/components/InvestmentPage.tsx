import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

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
  planName: string
  invested: number
  currentValue: number
  startDate: string
  status: 'active' | 'pending'
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    roi: 5,
    minInvestment: 100,
    maxInvestment: 1000,
    description: 'Perfect for beginners looking to grow their wealth steadily.'
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    roi: 8,
    minInvestment: 1000,
    maxInvestment: 10000,
    description: 'Accelerated returns for serious investors.'
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    roi: 12,
    minInvestment: 10000,
    maxInvestment: 100000,
    description: 'Maximum returns with exclusive priority support.'
  }
]

const activeInvestments: ActiveInvestment[] = [
  {
    id: '1',
    planName: 'Growth Plan',
    invested: 2500,
    currentValue: 2850,
    startDate: '2026-07-15',
    status: 'active'
  },
  {
    id: '2',
    planName: 'Starter Plan',
    invested: 500,
    currentValue: 562.5,
    startDate: '2026-08-01',
    status: 'active'
  }
]

export default function InvestmentPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.invested, 0)
  const totalEarnings = activeInvestments.reduce((sum, inv) => sum + (inv.currentValue - inv.invested), 0)
  const activePlansCount = activeInvestments.filter(inv => inv.status === 'active').length

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-2">
          Investment Plans
        </h1>
        <p className="text-text-secondary mb-10 max-w-2xl">
          Choose the plan that fits your financial goals. All plans come with guaranteed monthly returns and full capital protection.
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
                    <span className="text-text-secondary text-sm ml-1">monthly return</span>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Min Investment</span>
                    <span className="text-text-primary font-medium">${plan.minInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Max Investment</span>
                    <span className="text-text-primary font-medium">${plan.maxInvestment.toLocaleString()}</span>
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
            My Investments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInvestments.map((investment) => {
              const profit = investment.currentValue - investment.invested
              const profitPercent = ((profit / investment.invested) * 100).toFixed(1)
              return (
                <div
                  key={investment.id}
                  className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-text-primary">{investment.planName}</h3>
                      <p className="text-text-secondary text-sm">Started {investment.startDate}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent capitalize">
                      {investment.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-text-secondary text-xs mb-1">Invested</p>
                      <p className="text-text-primary font-semibold">${investment.invested.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-secondary text-xs mb-1">Current Value</p>
                      <p className="text-accent font-semibold">${investment.currentValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-secondary text-xs mb-1">Profit</p>
                      <p className="text-status-success font-semibold">+${profit.toLocaleString()} (+{profitPercent}%)</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-6">
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream">
              <p className="text-text-secondary text-sm mb-1">Total Invested</p>
              <p className="text-2xl font-bold text-text-primary">${totalInvested.toLocaleString()}</p>
            </div>
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream">
              <p className="text-text-secondary text-sm mb-1">Active Plans</p>
              <p className="text-2xl font-bold text-text-primary">{activePlansCount}</p>
            </div>
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5 shadow-cream">
              <p className="text-text-secondary text-sm mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-status-success">+${totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
