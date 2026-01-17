'use client'

import { 
  MapPin, 
  DollarSign, 
  Home, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  User,
  Phone,
  Mail,
  Star,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CalendarX
} from 'lucide-react'

interface Phone {
  id: string
  number: string
  type: string | null
  is_dnc: boolean | null
  is_verified: boolean | null
}

interface Email {
  id: string
  email: string
  is_verified: boolean | null
}

interface Contact {
  id: string
  name: string
  role: string | null
  is_decision_maker: boolean | null
  phones?: Phone[]
  emails?: Email[]
}

interface Property {
  id: string
  street_address: string
  city: string
  state: string | null
  zip: string | null
  price: number | null
  sqft: number | null
  beds: number | null
  baths: number | null
  year_built: number | null
  list_date: string | null
  dom: number | null
  status: string | null
  contacts?: Contact[]
}

interface Props {
  property: Property
  isExpanded: boolean
  onToggle: () => void
  selectedPhones: Set<string>
  selectedEmails: Set<string>
  onTogglePhone: (id: string) => void
  onToggleEmail: (id: string) => void
  onSelectAllPhones: () => void
  onSelectAllEmails: () => void
}

export function PropertyCard({
  property,
  isExpanded,
  onToggle,
  selectedPhones,
  selectedEmails,
  onTogglePhone,
  onToggleEmail,
  onSelectAllPhones,
  onSelectAllEmails
}: Props) {
  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A'
    return '$' + price.toLocaleString()
  }

  // Calculate expired date from list_date + dom
  const getExpiredInfo = () => {
    if (!property.list_date) return null
    
    const listDate = new Date(property.list_date)
    const dom = property.dom || 0
    const expiredDate = new Date(listDate)
    expiredDate.setDate(expiredDate.getDate() + dom)
    
    // Calculate days since expired
    const today = new Date()
    const daysSinceExpired = Math.floor((today.getTime() - expiredDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      date: expiredDate,
      daysSince: daysSinceExpired,
      formatted: expiredDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const expiredInfo = getExpiredInfo()

  // Count stats
  const contactCount = property.contacts?.length || 0
  const phoneCount = property.contacts?.reduce((sum, c) => sum + (c.phones?.length || 0), 0) || 0
  const callableCount = property.contacts?.reduce(
    (sum, c) => sum + (c.phones?.filter(p => !p.is_dnc).length || 0), 
    0
  ) || 0
  const emailCount = property.contacts?.reduce((sum, c) => sum + (c.emails?.length || 0), 0) || 0

  // Check if any items from this property are selected
  const hasSelectedItems = property.contacts?.some(c => 
    c.phones?.some(p => selectedPhones.has(p.id)) ||
    c.emails?.some(e => selectedEmails.has(e.id))
  )

  return (
    <div className={`bg-navy-800 border rounded-xl overflow-hidden transition-colors ${
      hasSelectedItems ? 'border-norx/50' : 'border-white/10 hover:border-white/20'
    }`}>
      {/* Property Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Address */}
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-gold-500 flex-shrink-0" />
              <span className="font-semibold text-white">
                {property.street_address}
              </span>
              <span className="text-white/50">
                {property.city}, {property.state} {property.zip}
              </span>
            </div>

            {/* Property Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              {property.price && (
                <div className="flex items-center gap-1">
                  <DollarSign size={14} className="text-emerald-400" />
                  <span className="font-semibold text-emerald-400">
                    {formatPrice(property.price)}
                  </span>
                </div>
              )}
              {property.beds && (
                <div className="flex items-center gap-1">
                  <Home size={14} />
                  <span>{property.beds} bed / {property.baths} bath</span>
                </div>
              )}
              {property.sqft && (
                <span>{property.sqft.toLocaleString()} sqft</span>
              )}
              {property.year_built && (
                <span>Built {property.year_built}</span>
              )}
              {property.dom && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{property.dom} DOM</span>
                </div>
              )}
              {/* Expired Date - Important! */}
              {expiredInfo && (
                <div className="flex items-center gap-1">
                  <CalendarX size={14} className="text-red-400" />
                  <span className="text-red-400">
                    Expired {expiredInfo.formatted}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    expiredInfo.daysSince <= 7 
                      ? 'bg-red-500/30 text-red-300' 
                      : expiredInfo.daysSince <= 30 
                      ? 'bg-orange-500/30 text-orange-300'
                      : 'bg-white/10 text-white/50'
                  }`}>
                    {expiredInfo.daysSince <= 0 
                      ? 'Today' 
                      : expiredInfo.daysSince === 1 
                      ? '1 day ago'
                      : `${expiredInfo.daysSince} days ago`}
                  </span>
                </div>
              )}
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mt-3">
              {property.status && (
                <span className={`text-xs px-2 py-1 rounded ${
                  property.status === 'Expired' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {property.status}
                </span>
              )}
              <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">
                {contactCount} contacts
              </span>
              {callableCount > 0 && (
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                  {callableCount} callable
                </span>
              )}
              {emailCount > 0 && (
                <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                  {emailCount} emails
                </span>
              )}
            </div>
          </div>

          {/* Expand Button */}
          <button className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded Contacts Section */}
      {isExpanded && (
        <div className="border-t border-white/10 bg-navy-900/50">
          {/* Quick Actions */}
          <div className="flex items-center gap-4 p-3 border-b border-white/10 bg-navy-900/50">
            <span className="text-xs text-white/40 uppercase tracking-wide">Quick Select:</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectAllPhones()
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
            >
              <Phone size={12} />
              All Phones ({callableCount})
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectAllEmails()
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center gap-1"
            >
              <Mail size={12} />
              All Emails ({emailCount})
            </button>
          </div>

          {/* Contacts */}
          <div className="p-4 space-y-4">
            {property.contacts?.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                selectedPhones={selectedPhones}
                selectedEmails={selectedEmails}
                onTogglePhone={onTogglePhone}
                onToggleEmail={onToggleEmail}
              />
            ))}

            {(!property.contacts || property.contacts.length === 0) && (
              <div className="text-center text-white/40 py-4">
                No contacts found for this property
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Contact Card Sub-component
function ContactCard({
  contact,
  selectedPhones,
  selectedEmails,
  onTogglePhone,
  onToggleEmail
}: {
  contact: Contact
  selectedPhones: Set<string>
  selectedEmails: Set<string>
  onTogglePhone: (id: string) => void
  onToggleEmail: (id: string) => void
}) {
  return (
    <div className="bg-navy-800 rounded-xl p-4">
      {/* Contact Header */}
      <div className="flex items-center gap-2 mb-3">
        <User size={16} className="text-gold-500" />
        <span className="font-semibold text-white">{contact.name}</span>
        {contact.role && (
          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
            {contact.role}
          </span>
        )}
        {contact.is_decision_maker && (
          <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
            <Star size={10} />
            Decision Maker
          </span>
        )}
      </div>

      {/* Phones */}
      {contact.phones && contact.phones.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-white/40 uppercase tracking-wide mb-2">Phones</div>
          <div className="flex flex-wrap gap-2">
            {contact.phones.map((phone) => (
              <PhoneChip
                key={phone.id}
                phone={phone}
                isSelected={selectedPhones.has(phone.id)}
                onToggle={() => onTogglePhone(phone.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Emails */}
      {contact.emails && contact.emails.length > 0 && (
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wide mb-2">Emails</div>
          <div className="flex flex-wrap gap-2">
            {contact.emails.map((email) => (
              <EmailChip
                key={email.id}
                email={email}
                isSelected={selectedEmails.has(email.id)}
                onToggle={() => onToggleEmail(email.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No contact info */}
      {(!contact.phones || contact.phones.length === 0) && 
       (!contact.emails || contact.emails.length === 0) && (
        <div className="text-white/30 text-sm">No contact information</div>
      )}
    </div>
  )
}

// Phone Chip
function PhoneChip({ 
  phone, 
  isSelected, 
  onToggle 
}: { 
  phone: Phone
  isSelected: boolean
  onToggle: () => void 
}) {
  const isDnc = phone.is_dnc === true

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (!isDnc) onToggle()
      }}
      disabled={isDnc}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
        isDnc
          ? 'bg-red-500/10 text-red-400/50 cursor-not-allowed'
          : isSelected
          ? 'bg-emerald-500/30 text-emerald-400 ring-2 ring-emerald-500/50'
          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
      }`}
    >
      {/* Checkbox */}
      {!isDnc && (
        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
          isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-emerald-500/50'
        }`}>
          {isSelected && <CheckCircle2 size={12} className="text-white" />}
        </div>
      )}
      
      <Phone size={14} />
      <span className="font-mono text-sm">{phone.number}</span>
      
      {phone.type && (
        <span className="text-xs opacity-60">({phone.type})</span>
      )}
      
      {phone.is_verified && (
        <CheckCircle2 size={12} className="text-emerald-300" />
      )}
      
      {isDnc && (
        <span className="flex items-center gap-1 text-xs">
          <AlertCircle size={12} />
          DNC
        </span>
      )}
    </button>
  )
}

// Email Chip
function EmailChip({ 
  email, 
  isSelected, 
  onToggle 
}: { 
  email: Email
  isSelected: boolean
  onToggle: () => void 
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
        isSelected
          ? 'bg-amber-500/30 text-amber-400 ring-2 ring-amber-500/50'
          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
      }`}
    >
      {/* Checkbox */}
      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
        isSelected ? 'bg-amber-500 border-amber-500' : 'border-amber-500/50'
      }`}>
        {isSelected && <CheckCircle2 size={12} className="text-white" />}
      </div>
      
      <Mail size={14} />
      <span className="text-sm">{email.email}</span>
      
      {email.is_verified && (
        <CheckCircle2 size={12} className="text-amber-300" />
      )}
    </button>
  )
}
