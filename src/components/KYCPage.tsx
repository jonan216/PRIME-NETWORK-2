import { useState } from 'react'
import { Shield, FileText, Upload, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, mapSupabaseError } from '../lib/supabaseClient'

type KycStep = 'idle' | 'submitted' | 'under_review' | 'approved' | 'rejected'

export default function KYCPage() {
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState<KycStep>('idle')

  const handleSubmit = async () => {
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ kyc_verified: true })
      .eq('id', user.id)

    if (error) {
      console.error('Error submitting KYC:', mapSupabaseError(error))
      alert('Failed to submit KYC documents. Please try again.')
      return
    }

    setStep('submitted')
    refreshProfile()
  }

  const steps = [
    { id: 'submitted', label: 'Documents Submitted', icon: Upload },
    { id: 'under_review', label: 'Under Review', icon: Clock },
    { id: 'approved', label: 'Approved', icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">KYC Verification</h1>

        <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={24} className="text-accent" />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Identity Verification</h2>
              <p className="text-sm text-text-secondary">Verify your identity to unlock full platform features</p>
            </div>
          </div>

          {step === 'idle' && (
            <div className="space-y-6">
              <div className="bg-cream-soft rounded-xl p-6 border border-cream-border">
                <h3 className="text-sm font-medium text-text-primary mb-4">Required Documents</h3>
                <ul className="space-y-2">
                  {['Government-issued ID (Passport or National ID)', 'Proof of Address (Utility bill or Bank statement)', 'Proof of Income (Payslip or Tax document)'].map(doc => (
                    <li key={doc} className="flex items-center gap-2 text-sm text-text-secondary">
                      <FileText size={16} className="text-accent" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-2 border-dashed border-cream-border rounded-xl p-8 text-center hover:border-accent/50 transition-colors">
                <Upload size={32} className="text-accent mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary mb-1">Drop files here or click to upload</p>
                <p className="text-xs text-text-secondary">PDF, JPG, PNG up to 10MB each</p>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full px-6 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
              >
                Submit Documents
              </button>
            </div>
          )}

          {step !== 'idle' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                {steps.map((s, index) => {
                  const Icon = s.icon
                  const isActive = step === s.id
                  const isPast = steps.findIndex(st => st.id === step) > index

                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-accent text-white' :
                        isPast ? 'bg-status-success text-white' :
                        'bg-cream-soft text-text-secondary'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>{s.label}</p>
                      </div>
                      {index < steps.length - 1 && <div className="hidden md:block w-12 h-px bg-cream-border ml-4" />}
                    </div>
                  )
                })}
              </div>

              <div className={`rounded-xl p-6 border ${
                step === 'approved' ? 'bg-status-success/5 border-status-success/20' :
                step === 'rejected' ? 'bg-status-error/5 border-status-error/20' :
                'bg-cream-soft border-cream-border'
              }`}>
                <div className="flex items-start gap-3">
                  {step === 'submitted' && <Clock size={20} className="text-status-warning mt-0.5" />}
                  {step === 'under_review' && <AlertCircle size={20} className="text-accent mt-0.5" />}
                  {step === 'approved' && <CheckCircle2 size={20} className="text-status-success mt-0.5" />}
                  {step === 'rejected' && <AlertCircle size={20} className="text-status-error mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {step === 'submitted' && 'Documents Submitted Successfully'}
                      {step === 'under_review' && 'Verification in Progress'}
                      {step === 'approved' && 'Verification Approved'}
                      {step === 'rejected' && 'Verification Rejected'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {step === 'submitted' && 'Your documents are being processed. This usually takes 1-2 business days.'}
                      {step === 'under_review' && 'Our team is reviewing your documents. You will be notified once complete.'}
                      {step === 'approved' && 'Your identity has been verified. You now have full access to all features.'}
                      {step === 'rejected' && 'Please review the requirements and resubmit your documents.'}
                    </p>
                  </div>
                </div>
              </div>

              {step === 'rejected' && (
                <button
                  onClick={() => setStep('idle')}
                  className="px-6 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
                >
                  Resubmit Documents
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
