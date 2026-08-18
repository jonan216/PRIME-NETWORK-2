import { useState, useEffect } from 'react'
import { Plus, PackageOpen, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, mapSupabaseError } from '../lib/supabaseClient'
import { formatDualCurrency } from '../lib/currency'

interface Package {
  id: string
  plan_name: string
  daily_roi: number
  amount: number
  status: string
  created_at: string
}

export default function PackagesPage() {
  const { profile, refreshProfile } = useAuth()
  const [showAddForm, setShowAddForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPackages() {
      if (!profile?.id) return
      setLoading(true)

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPackages(data)
      } else if (error) {
        console.error('Error loading packages:', mapSupabaseError(error))
      }
      setLoading(false)
    }

    loadPackages()
  }, [profile?.id])

  const totalInvested = packages.reduce((sum, p) => sum + (p.amount || 0), 0)
  const activeCount = packages.filter(p => p.status === 'active').length

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return
    setError('')

    const numAmount = parseFloat(amount)
    const dailyRoi = 1.5
    const planName = 'Prime Daily Earning'

    if (isNaN(numAmount) || numAmount < 5000) {
      setError('Minimum investment amount is UGX 5,000')
      return
    }

    if ((profile?.balance ?? 0) < numAmount) {
      setError(`Insufficient balance. You need UGX ${numAmount.toLocaleString()} but your available balance is UGX ${(profile?.balance ?? 0).toLocaleString()}.`)
      return
    }

    setSubmitting(true)

    const { data, error } = await supabase.from('investments').insert({
      user_id: profile.id,
      plan_name: planName,
      amount: numAmount,
      daily_roi: dailyRoi,
      status: 'active'
    }).select().single()

    setSubmitting(false)

    if (error) {
      setError(mapSupabaseError(error) || 'Failed to add package')
      return
    }

    if (data) {
      setPackages(prev => [data, ...prev])
      try {
        await supabase.rpc('increment_balance', { p_user_id: profile.id, p_amount: -numAmount })
        const { error: rpcError } = await supabase.rpc('process_referral_bonus', { p_investor_id: profile.id, p_amount: numAmount })
        if (rpcError) console.error('Referral bonus error:', mapSupabaseError(rpcError))
      } catch (err) {
        console.error('Balance deduction error:', err as any)
      }
      refreshProfile()
    }

    setShowAddForm(false)
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
          {error && <p className="text-status-error text-sm mb-4">{error}</p>}
          <form onSubmit={handleAddPackage} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Investment Amount (UGX)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
                min={5000}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                Add Package
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Total Invested</p>
          <p className="text-2xl font-display font-bold text-text-primary">{formatDualCurrency(totalInvested)}</p>
        </div>
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Active Packages</p>
          <p className="text-2xl font-display font-bold text-text-primary">{activeCount}</p>
        </div>
      </div>

      <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Your Packages</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={28} /></div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <PackageOpen size={44} className="text-text-secondary/30 mb-3" />
            <p className="text-text-secondary font-medium text-sm">No packages yet</p>
            <p className="text-text-secondary/60 text-xs mt-1">Click "Add Package" above to start your first investment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Package</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Daily Rate</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Invested</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {packages.map(pkg => (
                  <tr key={pkg.id}>
                    <td className="py-4 text-sm font-medium text-text-primary">{pkg.plan_name}</td>
                    <td className="py-4 text-sm text-accent">{pkg.daily_roi}%</td>
                    <td className="py-4 text-sm text-text-primary">{formatDualCurrency(pkg.amount)}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-success/10 text-status-success capitalize">
                        {pkg.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-text-secondary">
                      {new Date(pkg.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
