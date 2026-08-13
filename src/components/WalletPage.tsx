import { useState } from 'react'
import { Copy } from 'lucide-react'

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'withdraw'>('overview')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">My Wallet</h1>
        <p className="text-text-secondary mt-1">Manage your funds and wallet settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Main Balance</p>
          <p className="text-3xl font-display font-bold text-accent">$4,380.00</p>
        </div>
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Total Invested</p>
          <p className="text-3xl font-display font-bold text-text-primary">$18,200.00</p>
        </div>
        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <p className="text-sm text-text-secondary mb-1">Total Earnings</p>
          <p className="text-3xl font-display font-bold text-status-success">$3,850.00</p>
        </div>
      </div>

      <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-accent text-white' : 'bg-cream-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'transfer' ? 'bg-accent text-white' : 'bg-cream-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Transfer
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'withdraw' ? 'bg-accent text-white' : 'bg-cream-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            Withdraw
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Wallet Addresses</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1">USD Wallet (Primary)</p>
                <div className="flex items-center gap-2 p-3 bg-cream-secondary rounded-xl border border-cream-border">
                  <code className="text-xs text-text-primary font-mono flex-1">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</code>
                  <button className="text-accent hover:text-accent-hover">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1">BTC Wallet</p>
                <div className="flex items-center gap-2 p-3 bg-cream-secondary rounded-xl border border-cream-border">
                  <code className="text-xs text-text-primary font-mono flex-1">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                  <button className="text-accent hover:text-accent-hover">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Transfer Funds</h3>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Transfer initiated successfully!'); }}>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Recipient Address</label>
                <input
                  type="text"
                  placeholder="Enter wallet address or email"
                  className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Amount ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                  min={1}
                />
              </div>
              <button type="submit" className="w-full px-6 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors">
                Send Transfer
              </button>
            </form>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Withdraw Funds</h3>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Withdrawal request submitted!'); }}>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Withdrawal Method</label>
                <select className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20">
                  <option>MTN Mobile Money</option>
                  <option>Airtel Money</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Phone Number / Account</label>
                <input
                  type="text"
                  placeholder="Enter phone number or bank account"
                  className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Amount ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                  min={50}
                />
              </div>
              <button type="submit" className="w-full px-6 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors">
                Request Withdrawal
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
