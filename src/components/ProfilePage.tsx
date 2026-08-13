import { useState } from 'react'
import { User, Mail, Phone, Globe, Lock, Camera, Shield } from 'lucide-react'

export default function ProfilePage() {
  const [name, setName] = useState('Alex Johnson')
  const [email, setEmail] = useState('alex@example.com')
  const [phone, setPhone] = useState('+1 (555) 123-4567')
  const [country, setCountry] = useState('United States')

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-2xl font-display font-semibold text-accent">AJ</span>
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors">
                  <Camera size={14} />
                </button>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-text-primary">{name}</h2>
              <p className="text-sm text-text-secondary">{email}</p>
              <p className="text-xs text-text-secondary mt-1">Member since August 2026</p>
            </div>

            <div className="mt-6 pt-6 border-t border-cream-border space-y-4">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-accent" />
                <div>
                  <p className="text-xs text-text-secondary">Email</p>
                  <p className="text-sm text-text-primary">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-accent" />
                <div>
                  <p className="text-xs text-text-secondary">Phone</p>
                  <p className="text-sm text-text-primary">{phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-accent" />
                <div>
                  <p className="text-xs text-text-secondary">Country</p>
                  <p className="text-sm text-text-primary">{country}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Phone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Country</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Security</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-cream-border">
                  <div className="flex items-center gap-3">
                    <Lock size={18} className="text-accent" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Change Password</p>
                      <p className="text-xs text-text-secondary">Update your account password</p>
                    </div>
                  </div>
                  <button className="text-sm text-accent hover:text-accent-hover font-medium">Change</button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-status-success" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                      <p className="text-xs text-text-secondary">Add an extra layer of security</p>
                    </div>
                  </div>
                  <button className="text-sm text-accent hover:text-accent-hover font-medium">Enable</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
