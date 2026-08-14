import { useState } from 'react'
import { Users, Copy, Check, TrendingUp, Share2, MessageCircle, Send, Gift } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ReferralPage() {
  const { user } = useAuth()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Generate dynamic referral code based on user ID or email hash
  const rawId = user?.id || 'MEMBER88'
  const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  const referralCode = `PRIME-${cleanId || 'PRO888'}`

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://prime-network-2.vercel.app'
  const referralLink = `${baseUrl}/register?ref=${referralCode}`

  const inviteMessage = `🚀 Join me on PRIME NETWORK and start earning daily returns on your investment!\n\nUse my referral code *${referralCode}* or click my registration link:\n👉 ${referralLink}`

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMessage)}`
    window.open(url, '_blank')
  }

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Join me on PRIME NETWORK! Code: ${referralCode}`)}`
    window.open(url, '_blank')
  }

  const shareGeneral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PRIME NETWORK Referral',
          text: inviteMessage,
          url: referralLink,
        })
      } catch {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  const stats = [
    { label: 'Total Referrals', value: '0', icon: Users, color: 'text-accent' },
    { label: 'Active Referrals', value: '0', icon: Users, color: 'text-status-success' },
    { label: 'Total Earnings', value: '$0.00 USD', icon: TrendingUp, color: 'text-accent' },
  ]

  const referralTiers = [
    { level: 'Level 1 (Direct)', rate: '5%', desc: 'Earn 5% commission on direct referrals' },
    { level: 'Level 2 (Secondary)', rate: '3%', desc: 'Earn 3% commission on secondary referrals' },
    { level: 'Level 3 (Tertiary)', rate: '1%', desc: 'Earn 1% commission on level 3 team growth' },
  ]

  return (
    <div className="min-h-screen bg-cream-primary pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary">Referral Program</h1>
          <p className="text-text-secondary text-sm mt-1">Invite friends to PRIME NETWORK and earn passive team commissions.</p>
        </div>

        {/* Primary Referral Link Card */}
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="text-accent" size={22} />
            <h2 className="text-lg font-semibold text-text-primary">Your Unique Invite Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Referral Link Box */}
            <div className="bg-cream-soft rounded-xl p-4 border border-cream-border flex flex-col justify-between">
              <div>
                <p className="text-xs text-text-secondary mb-1">Your Referral Link</p>
                <p className="text-sm text-text-primary font-mono break-all font-medium select-all">{referralLink}</p>
              </div>
              <button
                onClick={copyLink}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors"
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                {copiedLink ? 'Link Copied!' : 'Copy Referral Link'}
              </button>
            </div>

            {/* Referral Code Box */}
            <div className="bg-cream-soft rounded-xl p-4 border border-cream-border flex flex-col justify-between">
              <div>
                <p className="text-xs text-text-secondary mb-1">Your Referral Code</p>
                <p className="text-xl text-accent font-mono font-bold tracking-wider">{referralCode}</p>
              </div>
              <button
                onClick={copyCode}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-cream-secondary hover:bg-cream-border text-text-primary border border-cream-border rounded-xl text-sm font-medium transition-colors"
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                {copiedCode ? 'Code Copied!' : 'Copy Referral Code'}
              </button>
            </div>
          </div>

          {/* Instant 1-Tap Share Buttons */}
          <div>
            <p className="text-xs text-text-secondary mb-2.5 font-medium">Share Instantly With Friends:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <MessageCircle size={18} />
                Share on WhatsApp
              </button>
              <button
                onClick={shareTelegram}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Send size={18} />
                Share on Telegram
              </button>
              <button
                onClick={shareGeneral}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Share2 size={18} />
                More Sharing Options
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {stats.map(stat => (
            <div key={stat.label} className="bg-cream-card rounded-cream-lg border border-cream-border p-5">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon size={20} className={stat.color} />
                <p className="text-xs text-text-secondary font-medium">{stat.label}</p>
              </div>
              <p className="text-2xl font-display font-semibold text-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Commission Structure & How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Commission Tiers</h2>
            <div className="space-y-3">
              {referralTiers.map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-cream-soft rounded-xl border border-cream-border">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{tier.level}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{tier.desc}</p>
                  </div>
                  <span className="text-lg font-bold text-accent px-3 py-1 bg-accent/10 rounded-lg">{tier.rate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">How Referral Bonus Works</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Share Link / Code', desc: 'Send your referral link or code to your network or friends.' },
                { step: 2, title: 'Friend Registers', desc: 'Your friend registers on PRIME NETWORK using your link or code.' },
                { step: 3, title: 'Instant Commission', desc: 'Receive instant cash commission credited to your wallet whenever they invest.' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referred Friends Table */}
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Referred Friends List</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-border">
                  <th className="text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">User</th>
                  <th className="text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Date Joined</th>
                  <th className="text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Status</th>
                  <th className="text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Commission Earned</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-text-secondary">
                    No referred members yet. Share your referral link above to start earning!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
