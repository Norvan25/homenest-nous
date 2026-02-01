'use client'

import { useEffect } from 'react'
import { 
  X, 
  MapPin, 
  DollarSign, 
  Home, 
  Calendar,
  Clock,
  Ruler,
  Building,
  Phone,
  Mail,
  User,
  Star,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  MessageSquare
} from 'lucide-react'
import type { LeadWithContacts, Contact, Phone as PhoneType, Email } from '@/lib/types'

interface Props {
  lead: LeadWithContacts
  onClose: () => void
}

export function LeadDetailModal({ lead, onClose }: Props) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const formatPrice = (price: number | null) => {
    if (!price) return 'Not Listed'
    return '$' + price.toLocaleString()
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Count totals
  let totalPhones = 0
  let callablePhones = 0
  let totalEmails = 0

  lead.contacts?.forEach((contact: Contact) => {
    totalPhones += contact.phones?.length || 0
    callablePhones += contact.phones?.filter(p => !p.is_dnc).length || 0
    totalEmails += contact.emails?.length || 0
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-navy-800 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <MapPin className="text-cyan-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{lead.street_address}</h2>
                <p className="text-white/50">{lead.city}, {lead.state} {lead.zip}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Property Details */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-sm uppercase tracking-wide text-white/40 mb-4">Property Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailItem 
                icon={<DollarSign className="text-emerald-400" />} 
                label="Price" 
                value={formatPrice(lead.price)}
                highlight
              />
              <DetailItem 
                icon={<Home className="text-cyan-400" />} 
                label="Beds / Baths" 
                value={`${lead.beds || '—'} / ${lead.baths || '—'}`}
              />
              <DetailItem 
                icon={<Ruler className="text-amber-400" />} 
                label="Sqft" 
                value={lead.sqft ? lead.sqft.toLocaleString() : '—'}
              />
              <DetailItem 
                icon={<Building className="text-violet-400" />} 
                label="Year Built" 
                value={lead.year_built?.toString() || '—'}
              />
              <DetailItem 
                icon={<Calendar className="text-pink-400" />} 
                label="List Date" 
                value={formatDate(lead.list_date)}
              />
              <DetailItem 
                icon={<Clock className="text-orange-400" />} 
                label="Days on Market" 
                value={lead.dom?.toString() || '—'}
              />
              <DetailItem 
                icon={<Ruler className="text-teal-400" />} 
                label="Lot Size" 
                value={lead.lot_size ? `${lead.lot_size} acres` : '—'}
              />
              <div className="flex items-center gap-3">
                {lead.status && (
                  <span className={`text-sm px-3 py-1.5 rounded-lg ${
                    lead.status === 'Expired' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {lead.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-6 py-4 bg-navy-900/50 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <User size={16} className="text-white/40" />
              <span className="text-white/70">{lead.contacts?.length || 0} contacts</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-emerald-400" />
              <span className="text-emerald-400">{callablePhones} callable</span>
              <span className="text-white/30">/ {totalPhones} total</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-amber-400" />
              <span className="text-amber-400">{totalEmails} emails</span>
            </div>
          </div>

          {/* Contacts */}
          <div className="p-6">
            <h3 className="text-sm uppercase tracking-wide text-white/40 mb-4">Contacts</h3>
            
            {!lead.contacts || lead.contacts.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                No contacts found for this property
              </div>
            ) : (
              <div className="space-y-4">
                {lead.contacts.map((contact: Contact) => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact}
                    onCall={handleCall}
                    onEmail={handleEmail}
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Future: Call History Placeholder */}
          <div className="p-6 border-t border-white/10">
            <h3 className="text-sm uppercase tracking-wide text-white/40 mb-4">Activity Log</h3>
            <div className="bg-navy-900/50 rounded-xl p-6 text-center">
              <MessageSquare className="mx-auto text-white/20 mb-3" size={32} />
              <p className="text-white/40 text-sm">
                Call history and notes will appear here
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-navy-900/50">
          <div className="text-xs text-white/30">
            Added {formatDate(lead.created_at)} · Source: {lead.source || 'Unknown'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors">
              Start Calling
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Detail Item Component
function DetailItem({ 
  icon, 
  label, 
  value, 
  highlight 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs text-white/40">{label}</div>
        <div className={`font-medium ${highlight ? 'text-emerald-400' : 'text-white'}`}>
          {value}
        </div>
      </div>
    </div>
  )
}

// Contact Card Component
function ContactCard({ 
  contact,
  onCall,
  onEmail,
  onCopy
}: { 
  contact: Contact
  onCall: (phone: string) => void
  onEmail: (email: string) => void
  onCopy: (text: string) => void
}) {
  return (
    <div className="bg-navy-900/50 rounded-xl border border-white/10 overflow-hidden">
      {/* Contact Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-full flex items-center justify-center">
              <User className="text-white/70" size={18} />
            </div>
            <div>
              <div className="font-semibold text-white">{contact.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {contact.role && (
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60 capitalize">
                    {contact.role}
                  </span>
                )}
                {contact.is_decision_maker && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                    <Star size={10} />
                    Decision Maker
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phones */}
      {contact.phones && contact.phones.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <div className="text-xs text-white/40 uppercase tracking-wide mb-3">Phone Numbers</div>
          <div className="space-y-2">
            {contact.phones.map((phone: PhoneType) => (
              <PhoneItem 
                key={phone.id} 
                phone={phone} 
                onCall={onCall}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}

      {/* Emails */}
      {contact.emails && contact.emails.length > 0 && (
        <div className="p-4">
          <div className="text-xs text-white/40 uppercase tracking-wide mb-3">Email Addresses</div>
          <div className="space-y-2">
            {contact.emails.map((email: Email) => (
              <EmailItem 
                key={email.id} 
                email={email} 
                onEmail={onEmail}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}

      {/* No contact info */}
      {(!contact.phones || contact.phones.length === 0) && (!contact.emails || contact.emails.length === 0) && (
        <div className="p-4 text-center text-white/40 text-sm">
          No contact information available
        </div>
      )}
    </div>
  )
}

// Phone Item Component
function PhoneItem({ 
  phone, 
  onCall,
  onCopy
}: { 
  phone: PhoneType
  onCall: (phone: string) => void
  onCopy: (text: string) => void
}) {
  const isDnc = phone.is_dnc === true
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isDnc ? 'bg-red-500/10' : 'bg-white/5 hover:bg-white/10'
    } transition-colors`}>
      <div className="flex items-center gap-3">
        <Phone size={16} className={isDnc ? 'text-red-400' : 'text-emerald-400'} />
        <div>
          <div className={`font-mono ${isDnc ? 'text-red-400/70' : 'text-white'}`}>
            {phone.number}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {phone.type && (
              <span className="text-xs text-white/40 capitalize">{phone.type}</span>
            )}
            {phone.is_verified && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Verified
              </span>
            )}
            {isDnc && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={10} />
                Do Not Call
              </span>
            )}
            {phone.last_result && (
              <span className="text-xs text-white/30">{phone.last_result}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onCopy(phone.number)}
          className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Copy number"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => onCall(phone.number)}
          disabled={isDnc}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isDnc
              ? 'bg-red-500/10 text-red-400/50 cursor-not-allowed'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          <Phone size={14} />
          Call
        </button>
      </div>
    </div>
  )
}

// Email Item Component
function EmailItem({ 
  email, 
  onEmail,
  onCopy
}: { 
  email: Email
  onEmail: (email: string) => void
  onCopy: (text: string) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <Mail size={16} className="text-amber-400" />
        <div>
          <div className="text-white">{email.email}</div>
          <div className="flex items-center gap-2 mt-0.5">
            {email.is_verified && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Verified
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onCopy(email.email)}
          className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Copy email"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => onEmail(email.email)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 font-medium hover:bg-amber-500/30 transition-colors"
        >
          <ExternalLink size={14} />
          Email
        </button>
      </div>
    </div>
  )
}
