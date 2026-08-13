import { useState } from 'react'
import { Users, Copy, Check, TrendingUp } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  joinedAt: string
  status: 'active' | 'inactive'
  investments: number
  yourEarnings: number
}

const teamMembers: TeamMember[] = [
  { id: '1', name: 'Sarah M.', email: 'sarah@example.com', joinedAt: '2026-08-01', status: 'active', investments: 5000, yourEarnings: 250 },
  { id: '2', name: 'David K.', email: 'david@example.com', joinedAt: '2026-07-28', status: 'active', investments: 3200, yourEarnings: 160 },
  { id: '3', name: 'Emma R.', email: 'emma@example.com', joinedAt: '2026-07-25', status: 'inactive', investments: 1000, yourEarnings: 50 },
  { id: '4', name: 'James T.', email: 'james@example.com', joinedAt: '2026-07-20', status: 'active', investments: 8500, yourEarnings: 425 },
]

export default function TeamPage() {
  const [copied, setCopied] = useState(false)
  const referralCode = 'PRIME-2024-X7K9'
  const referralLink = `https://prime-network.com/ref/${referralCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalTeamEarnings = teamMembers.reduce((sum, m) => sum + m.yourEarnings, 0)
  const activeMembers = teamMembers.filter(m => m.status === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">My Team</h1>
        <p className="text-text-secondary mt-1">Manage your referrals and track team earnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-accent" />
            <p className="text-sm text-text-secondary">Total Referrals</p>
          </div>
          <p className="text-2xl font-display font-bold text-text-primary">{teamMembers.length}</p>
          <p className="text-xs text-text-secondary mt-1">{activeMembers} active members</p>
        </div>
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-accent" />
            <p className="text-sm text-text-secondary">Total Earnings</p>
          </div>
          <p className="text-2xl font-display font-bold text-status-success">${totalTeamEarnings.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-1">Lifetime earnings</p>
        </div>
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-accent" />
            <p className="text-sm text-text-secondary">Referral Commissions</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">1st Level</span>
              <span className="text-sm font-bold text-status-success">5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">2nd Level</span>
              <span className="text-sm font-bold text-status-success">3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">3rd Level</span>
              <span className="text-sm font-bold text-status-success">1%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Your Referral Code & Link</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-text-secondary mb-1">Referral Code</p>
            <div className="flex items-center gap-2 p-3 bg-cream-soft rounded-xl border border-cream-border">
              <code className="text-sm text-text-primary font-mono font-bold">{referralCode}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(referralCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="text-accent hover:text-accent-hover"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-1">Referral Link</p>
            <div className="flex items-center gap-2 p-3 bg-cream-soft rounded-xl border border-cream-border">
              <code className="text-sm text-text-primary font-mono flex-1 break-all">{referralLink}</code>
              <button
                onClick={copyToClipboard}
                className="text-accent hover:text-accent-hover"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: 1, title: 'Share', desc: 'Share your unique referral link or code with friends' },
            { step: 2, title: 'Sign Up', desc: 'Your referrals sign up and make their first deposit' },
            { step: 3, title: 'Earn', desc: 'Earn 5% from Level 1, 3% from Level 2, and 1% from Level 3 referrals' },
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

      <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Your Team</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream-border">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Name</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Email</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Joined</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Investments</th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Your Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {teamMembers.map(member => (
                <tr key={member.id}>
                  <td className="py-4 text-sm text-text-primary">{member.name}</td>
                  <td className="py-4 text-sm text-text-secondary">{member.email}</td>
                  <td className="py-4 text-sm text-text-secondary">{member.joinedAt}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-status-success/10 text-status-success' : 'bg-text-secondary/10 text-text-secondary'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-text-primary text-right">${member.investments.toLocaleString()}</td>
                  <td className="py-4 text-sm text-status-success text-right font-medium">+${member.yourEarnings.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
