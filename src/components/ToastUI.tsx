import { useToast } from './Toast'
import { X } from 'lucide-react'

export default function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-cream-lg border
            ${toast.type === 'success' ? 'bg-cream-card border-status-success/30 text-status-success' : ''}
            ${toast.type === 'error' ? 'bg-cream-card border-status-error/30 text-status-error' : ''}
            ${toast.type === 'info' ? 'bg-cream-card border-cream-border text-text-primary' : ''}
          `}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
