import { useState } from 'react'
import { MessageCircle, Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'How do I make my first deposit?',
    answer: 'Navigate to the Deposit page, enter your desired amount, select a payment method, and follow the on-screen instructions. Bank transfers typically take 1-3 business days, while crypto deposits are confirmed within minutes.',
  },
  {
    question: 'What are the withdrawal processing times?',
    answer: 'Bank transfers take 3-5 business days. Crypto withdrawals are processed within 24 hours after confirmation. Card withdrawals take 1-2 business days. All withdrawals require identity verification for security.',
  },
  {
    question: 'How are investment returns calculated?',
    answer: 'Returns vary by plan. Gold Plans typically yield 8-12% annually, while Platinum Plans can reach 15-20%. Returns are compounded monthly and paid out according to your selected payout schedule.',
  },
  {
    question: 'Is my investment secure?',
    answer: 'Yes. We employ bank-grade AES-256 encryption, cold storage for crypto assets, and maintain full regulatory compliance. Your funds are protected by our comprehensive insurance policy covering digital asset custody.',
  },
  {
    question: 'Can I withdraw my investment early?',
    answer: 'Early withdrawal is possible depending on your plan terms. Standard plans allow early withdrawal with a 1-3% penalty. Premium plans offer penalty-free early exit after a 90-day holding period.',
  },
]

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'deposit', label: 'Deposit Issue' },
    { value: 'withdrawal', label: 'Withdrawal Issue' },
    { value: 'investment', label: 'Investment Support' },
    { value: 'technical', label: 'Technical Problem' },
    { value: 'account', label: 'Account & Security' },
  ]

  return (
    <div className="min-h-screen bg-cream-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-8">Support</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-6">Send us a Message</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-4 py-3 bg-cream-secondary border border-cream-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors">
                <Mail size={18} />
                Send Message
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Frequently Asked Questions</h3>

              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-cream-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-cream-soft/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-text-primary pr-4">{faq.question}</span>
                      {openFaq === i ? (
                        <ChevronUp size={18} className="text-text-secondary flex-shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-text-secondary flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-text-secondary leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-cream-card rounded-cream-lg border border-cream-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Contact Information</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cream-soft flex items-center justify-center">
                    <Mail size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Email Support</p>
                    <p className="text-sm text-text-secondary">support@primenetwork.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cream-soft flex items-center justify-center">
                    <Phone size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Phone Support</p>
                    <p className="text-sm text-text-secondary">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cream-soft flex items-center justify-center">
                    <MessageCircle size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Live Chat</p>
                    <p className="text-sm text-text-secondary">Available Mon-Fri, 9AM - 6PM EST</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
