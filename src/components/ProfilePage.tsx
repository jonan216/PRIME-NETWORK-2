import { useState, useEffect } from 'react'
import { User, Mail, Phone, Lock, Camera, Shield, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, mapSupabaseError } from '../lib/supabaseClient'

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone('')
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    setSuccessMsg('')

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id)

    setSaving(false)
    if (error) {
      alert(mapSupabaseError(error))
    } else {
      setSuccessMsg('Profile updated successfully!')
      refreshProfile()
    }
  }

  const userEmail = profile?.email || user?.email || 'N/A'
  const username = profile?.username || 'user'
  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'August 2026'

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-2xl font-display font-semibold text-accent uppercase">
                    {(profile?.full_name || username).substring(0, 2)}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors">
                  <Camera size={14} />
                </button>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-text-primary">{profile?.full_name || username}</h2>
              <p className="text-sm text-text-secondary">@{username}</p>
              <p className="text-xs text-text-secondary mt-1">Member since {joinDate}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-cream-border space-y-4">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-accent" />
                <div>
                  <p className="text-xs text-text-secondary">Email</p>
                  <p className="text-sm text-text-primary">{userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-accent" />
                <div>
                  <p className="text-xs text-text-secondary">Role</p>
                  <p className="text-sm text-text-primary capitalize">{profile?.role || 'User'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Personal Information</h3>
              
              {successMsg && (
                <div className="mb-4 p-3 bg-status-success/10 border border-status-success/30 text-status-success rounded-xl flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} />
                  {successMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Username</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      value={username}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-cream-secondary/50 border border-cream-border rounded-xl text-text-secondary cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="email"
                      value={userEmail}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-cream-secondary/50 border border-cream-border rounded-xl text-text-secondary cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+256 700 000 000"
                      className="w-full pl-11 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Account Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-cream-border">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className={profile?.kyc_verified ? "text-status-success" : "text-status-warning"} />
                    <div>
                      <p className="text-sm font-medium text-text-primary">KYC Verification</p>
                      <p className="text-xs text-text-secondary">Identity verification status</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    profile?.kyc_verified ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'
                  }`}>
                    {profile?.kyc_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Lock size={18} className="text-accent" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Account Status</p>
                      <p className="text-xs text-text-secondary">Current active status in network</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-status-success/10 text-status-success capitalize">
                    {profile?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
