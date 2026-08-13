import { useState } from 'react'
import { Plus } from 'lucide-react'

interface Package {
  id: string
  name: string
  roi: number
  minInvestment: number
  maxInvestment: number
  invested: number
  earnings: number
  status: 'active' | 'completed' | 'cancelled'
  startDate: string
}

const packages: Package[] = [
  {
    id: '1',
    name: 'Starter Plan',
    roi: 1.2,
    minInvestment: 5,
    maxInvestment: 100,
    invested: 50,
    earnings: 0.60,
    status: 'active',
    startDate: '2026-08-01',
  },
  {
    id: '2',
    name: 'Growth Plan',
    roi: 1.2,
    minInvestment: 101,
    maxInvestment: 1000,
    invested: 500,
    earnings: 6.00,
    status: 'active',
    startDate: '2026-07-15',
  },
  {
    id: '3',
    name: 'Premium Plan',
    roi: 1.2,
    minInvestment: 1001,
    maxInvestment: 10000,
    invested: 5000,
    earnings: 60.00,
    status: 'completed',
    startDate: '2026-06-01',
  },
  {
    id: '4',
    name: 'Basic Plan',
    roi: 1.2,
    minInvestment: 5,
    maxInvestment: 100,
    invested: 20,
    earnings: 0,
    status: 'cancelled',
    startDate: '2026-05-10',
  },
]

export default function PackagesPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [amount, setAmount] = useState('')

  const totalInvested = packages.reduce((sum, p) => sum + p.invested, 0)
  const totalEarnings = packages.reduce((sum, p) => sum + p.earnings, 0)
  const activeCount = packages.filter(p => p.status === 'active').length
  const completedCount = packages.filter(p => p.status === 'completed').length
  const cancelledCount = packages.filter(p => p.status === 'cancelled').length

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Package added: ${selectedPlan} with $${amount}`)
    setShowAddForm(false)
    setSelectedPlan('')
    setAmount('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">My Packages</h1>
          <p className="text-text-secondary mt-1">Manage your investment packages</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
        >
          <Plus size={18} />
          Add Package
        </button>
      </div>

      {showAddForm && (
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Add New Package</h2>
          <form onSubmit={handleAddPackage} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Select Plan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              >
                <option value="">Choose a plan</option>
                <option value="Starter Plan">Starter Plan - 1.2% Daily</option>
                <option value="Growth Plan">Growth Plan - 1.2% Daily</option>
                <option value="Premium Plan">Premium Plan - 1.2% Daily</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Investment Amount ($)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
                 min={5}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors">
                Add Package
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Total Invested</p>
          <p className="text-2xl font-display font-bold text-text-primary">${totalInvested.toLocaleString()}</p>
        </div>
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Total Daily Earnings</p>
          <p className="text-2xl font-display font-bold text-status-success">${totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Active Packages</p>
          <p className="text-2xl font-display font-bold text-text-primary">{activeCount}</p>
        </div>
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Completed / Cancelled</p>
          <p className="text-2xl font-display font-bold text-text-primary">{completedCount} / {cancelledCount}</p>
        </div>
      </div>

      <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Your Packages</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream-border">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Package</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Daily Rate</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Invested</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Daily Earnings</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {packages.map(pkg => (
                <tr key={pkg.id}>
                  <td className="py-4 text-sm font-medium text-text-primary">{pkg.name}</td>
                  <td className="py-4 text-sm text-accent">1.2%</td>
                  <td className="py-4 text-sm text-text-primary">${pkg.invested.toLocaleString()}</td>
                  <td className="py-4 text-sm text-status-success">+${pkg.earnings.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pkg.status === 'active' ? 'bg-status-success/10 text-status-success' :
                      pkg.status === 'completed' ? 'bg-accent/10 text-accent' :
                      'bg-status-error/10 text-status-error'
                    }`}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-text-secondary">{pkg.startDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
