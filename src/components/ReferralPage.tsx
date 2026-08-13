import { useState } from 'react'
import { Users, Copy, Check, TrendingUp } from 'lucide-react'

export default function ReferralPage() {
  const [copied, setCopied] = useState(false)
  const referralCode = 'PRIME-2024-X7K9'
  const referralLink = `https://prime-network.com/ref/${referralCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stats = [
    { label: 'Total Referrals', value: '0', icon: Users },
    { label: 'Active Referrals', value: '0', icon: Users },
    { label: 'Total Earnings', value: '$0.00', icon: TrendingUp },
  ]

  const referrals: Array<{ name: string; date: string; status: string; earnings: string }> = []

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">Referrals</h1>

        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Your Referral Code</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-cream-soft rounded-xl p-4 border border-cream-border">
              <p className="text-sm text-text-secondary mb-1">Referral Link</p>
              <p className="text-sm text-text-primary font-mono break-all">{referralLink}</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats.map(stat => (
            <div key={stat.label} className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon size={20} className="text-accent" />
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
              <p className="text-2xl font-display font-semibold text-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Share', desc: 'Share your unique referral link with friends' },
              { step: 2, title: 'Sign Up', desc: 'Your friend signs up and makes their first deposit' },
              { step: 3, title: 'Earn', desc: 'You earn 5% commission on their investments' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6 mt-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Your Referrals</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Name</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Date Joined</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {referrals.map((ref, index) => (
                  <tr key={index}>
                    <td className="py-3 text-sm text-text-primary">{ref.name}</td>
                    <td className="py-3 text-sm text-text-secondary">{ref.date}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ref.status === 'Active' ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-text-primary">{ref.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
