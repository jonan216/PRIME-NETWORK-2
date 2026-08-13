import { useState } from 'react'
import { Bell, Mail, MessageSquare, Smartphone, Check, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  type: 'system' | 'investment' | 'general'
  title: string
  message: string
  timestamp: string
  read: boolean
}

const mockNotifications: Notification[] = []

const notificationTabs = ['All', 'Unread', 'System', 'Investment'] as const
type NotificationTab = typeof notificationTabs[number]

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('All')
  const [notifications, setNotifications] = useState(mockNotifications)

  const filtered = notifications.filter(n => {
    if (activeTab === 'Unread') return !n.read
    if (activeTab === 'System') return n.type === 'system'
    if (activeTab === 'Investment') return n.type === 'investment'
    return true
  })

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-semibold text-text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              <CheckCheck size={18} />
              Mark All as Read
            </button>
          )}
        </div>

        <div className="bg-cream-card rounded-cream-lg border border-cream-border overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-cream-border bg-cream-secondary/50">
            {notificationTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-cream-card text-text-primary shadow-cream'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
                {tab === 'Unread' && unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-accent text-white rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="divide-y divide-cream-border">
            {filtered.map(n => (
              <div
                key={n.id}
                className={`p-4 sm:p-5 transition-colors hover:bg-cream-soft/20 ${
                  !n.read ? 'border-l-4 border-accent bg-cream-soft/30' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !n.read ? 'bg-accent/10' : 'bg-cream-soft'
                  }`}>
                    <Bell size={18} className={!n.read ? 'text-accent' : 'text-text-secondary'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-semibold ${!n.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {n.title}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">{n.message}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read ? (
                          <Check size={16} className="text-accent" />
                        ) : (
                          <CheckCheck size={16} className="text-cream-border" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">{n.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Bell size={40} className="text-cream-border mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No notifications to display.</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-cream-card rounded-cream-lg border border-cream-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-cream-border last:border-0">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Email Notifications</p>
                  <p className="text-xs text-text-secondary">Receive updates via email</p>
                </div>
              </div>
              <Toggle />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-cream-border last:border-0">
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Push Notifications</p>
                  <p className="text-xs text-text-secondary">Receive push alerts on your device</p>
                </div>
              </div>
              <Toggle defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">SMS Notifications</p>
                  <p className="text-xs text-text-secondary">Receive text message alerts</p>
                </div>
              </div>
              <Toggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-cream-border'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
