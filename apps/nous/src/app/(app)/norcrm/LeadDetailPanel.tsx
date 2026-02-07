'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  X,
  MapPin,
  DollarSign,
  Home,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  Star,
  AlertCircle,
  CheckCircle2,
  Plus,
  Save,
  MessageSquare,
  PhoneCall,
  FileText,
  Flame,
  CalendarX,
  MoreVertical,
  LogOut,
  Trash2
} from 'lucide-react'
import { DropdownMenu } from '@/components/ui'

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
  source: string | null
  contacts?: Contact[]
}

interface CRMLead {
  id: string
  property_id: string
  status: string
  priority: string
  next_action: string | null
  next_action_date: string | null
  last_activity_date: string | null
  created_at: string
  updated_at: string
  property?: Property
  callablePhones: number
  totalEmails: number
}

interface Activity {
  id: string
  crm_lead_id: string
  activity_type: string
  outcome: string | null
  notes: string | null
  created_at: string
}

interface Props {
  lead: CRMLead
  onClose: () => void
  onUpdate: (lead: CRMLead) => void
  onRemoveFromCRM?: () => void
  onDeleteCompletely?: () => void
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'text-blue-400' },
  { value: 'contacted', label: 'Contacted', color: 'text-yellow-400' },
  { value: 'interested', label: 'Interested', color: 'text-green-400' },
  { value: 'appointment', label: 'Appointment', color: 'text-cyan-400' },
  { value: 'closed', label: 'Closed', color: 'text-purple-400' },
  { value: 'dead', label: 'Dead', color: 'text-gray-400' },
]

const priorityOptions = [
  { value: 'hot', label: '🔥 Hot', color: 'text-red-400' },
  { value: 'normal', label: 'Normal', color: 'text-white/60' },
  { value: 'low', label: 'Low', color: 'text-gray-400' },
]

const callOutcomes = [
  { value: 'answered', label: 'Answered' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'wrong_number', label: 'Wrong Number' },
]

const answeredOutcomes = [
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'callback', label: 'Callback Requested' },
  { value: 'appointment_set', label: 'Appointment Set' },
]

export function LeadDetailPanel({ lead, onClose, onUpdate, onRemoveFromCRM, onDeleteCompletely }: Props) {
  // Form state
  const [status, setStatus] = useState(lead.status)
  const [priority, setPriority] = useState(lead.priority)
  const [nextAction, setNextAction] = useState(lead.next_action || '')
  const [nextActionDate, setNextActionDate] = useState(lead.next_action_date?.split('T')[0] || '')
  const [isSaving, setIsSaving] = useState(false)

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  // Log Call Modal
  const [showCallModal, setShowCallModal] = useState(false)
  const [callOutcome, setCallOutcome] = useState('')
  const [callSubOutcome, setCallSubOutcome] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [loggingCall, setLoggingCall] = useState(false)

  // Add Note Modal
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Fetch contacts
  useEffect(() => {
    async function fetchContacts() {
      setLoadingContacts(true)
      const { data, error } = await supabase
        .from('contacts')
        .select('*, phones(*), emails(*)')
        .eq('property_id', lead.property_id)

      if (!error && data) {
        setContacts(data)
      }
      setLoadingContacts(false)
    }
    fetchContacts()
  }, [lead.property_id])

  // Fetch activities
  useEffect(() => {
    async function fetchActivities() {
      setLoadingActivities(true)
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('crm_lead_id', lead.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setActivities(data)
      }
      setLoadingActivities(false)
    }
    fetchActivities()
  }, [lead.id])

  // Save lead changes
  const handleSave = async () => {
    setIsSaving(true)
    const { data, error } = await (supabase
      .from('crm_leads') as any)
      .update({
        status,
        priority,
        next_action: nextAction || null,
        next_action_date: nextActionDate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id)
      .select()
      .single()

    if (!error && data) {
      onUpdate({ ...lead, ...data })
    }
    setIsSaving(false)
  }

  // Log call
  const handleLogCall = async () => {
    setLoggingCall(true)
    const outcome = callOutcome === 'answered' && callSubOutcome 
      ? `${callOutcome}:${callSubOutcome}`
      : callOutcome

    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        crm_lead_id: lead.id,
        activity_type: 'call',
        outcome,
        notes: callNotes || null
      })
      .select()
      .single()

    if (!error && data) {
      setActivities(prev => [data, ...prev])
      
      // Update lead's last activity date
      await supabase
        .from('crm_leads')
        .update({ 
          last_activity_date: new Date().toISOString(),
          status: status === 'new' ? 'contacted' : status
        })
        .eq('id', lead.id)

      // Reset form
      setCallOutcome('')
      setCallSubOutcome('')
      setCallNotes('')
      setShowCallModal(false)
      
      // Update parent
      onUpdate({ 
        ...lead, 
        last_activity_date: new Date().toISOString(),
        status: status === 'new' ? 'contacted' : status
      })
      if (status === 'new') setStatus('contacted')
    }
    setLoggingCall(false)
  }

  // Add note
  const handleAddNote = async () => {
    setSavingNote(true)
    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        crm_lead_id: lead.id,
        activity_type: 'note',
        notes: noteText
      })
      .select()
      .single()

    if (!error && data) {
      setActivities(prev => [data, ...prev])
      setNoteText('')
      setShowNoteModal(false)
    }
    setSavingNote(false)
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '—'
    return '$' + price.toLocaleString()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Calculate expired date
  const getExpiredDate = () => {
    if (!lead.property?.list_date) return null
    const listDate = new Date(lead.property.list_date)
    const dom = lead.property.dom || 0
    const expiredDate = new Date(listDate)
    expiredDate.setDate(expiredDate.getDate() + dom)
    return expiredDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const activityIcons: Record<string, any> = {
    call: PhoneCall,
    email: Mail,
    note: FileText,
    status_change: CheckCircle2,
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-navy-800 border-l border-white/10 z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-800 border-b border-white/10 p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Lead Details</h2>
            <div className="flex items-center gap-2">
              {(onRemoveFromCRM || onDeleteCompletely) && (
                <DropdownMenu
                  items={[
                    ...(onRemoveFromCRM ? [{
                      label: 'Remove from CRM',
                      icon: <LogOut size={16} />,
                      onClick: onRemoveFromCRM
                    }] : []),
                    ...(onDeleteCompletely ? [{
                      label: 'Delete Completely',
                      icon: <Trash2 size={16} />,
                      onClick: onDeleteCompletely,
                      variant: 'danger' as const
                    }] : [])
                  ]}
                />
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 text-white">
            <MapPin size={18} className="text-norv" />
            <span className="font-semibold">{lead.property?.street_address}</span>
          </div>
          <div className="text-white/50 ml-6">
            {lead.property?.city}, {lead.property?.state} {lead.property?.zip}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Property Info */}
          <div className="bg-navy-900/50 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-white/40">Price</div>
                <div className="text-white font-semibold">{formatPrice(lead.property?.price || null)}</div>
              </div>
              <div>
                <div className="text-white/40">Beds/Baths</div>
                <div className="text-white">{lead.property?.beds || '—'} / {lead.property?.baths || '—'}</div>
              </div>
              <div>
                <div className="text-white/40">Sqft</div>
                <div className="text-white">{lead.property?.sqft?.toLocaleString() || '—'}</div>
              </div>
              <div>
                <div className="text-white/40">DOM</div>
                <div className="text-white">{lead.property?.dom || '—'}</div>
              </div>
              <div>
                <div className="text-white/40">Expired</div>
                <div className="text-red-400">{getExpiredDate() || '—'}</div>
              </div>
              <div>
                <div className="text-white/40">Year Built</div>
                <div className="text-white">{lead.property?.year_built || '—'}</div>
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="bg-navy-900/50 rounded-xl p-4 space-y-4">
            <h3 className="text-sm text-white/40 uppercase tracking-wide">Lead Status</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-norv/50"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-norv/50"
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1">Next Action</label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g., Call back, Send email..."
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-norv/50"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1">Next Action Date</label>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-norv/50"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-norv text-white rounded-lg font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Contacts */}
          <div className="bg-navy-900/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-white/40 uppercase tracking-wide">Contacts</h3>
            </div>

            {loadingContacts ? (
              <div className="text-white/50 text-center py-4">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="text-white/50 text-center py-4">No contacts found</div>
            ) : (
              <div className="space-y-4">
                {contacts.map(contact => (
                  <div key={contact.id} className="bg-navy-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-norv" />
                      <span className="font-medium text-white">{contact.name}</span>
                      {contact.role && (
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
                          {contact.role}
                        </span>
                      )}
                      {contact.is_decision_maker && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          <Star size={10} className="inline mr-1" />
                          DM
                        </span>
                      )}
                    </div>

                    {/* Phones */}
                    {contact.phones && contact.phones.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {contact.phones.map(phone => (
                          <div key={phone.id} className="flex items-center gap-2">
                            <a
                              href={`tel:${phone.number}`}
                              className={`flex items-center gap-2 text-sm ${
                                phone.is_dnc 
                                  ? 'text-red-400/50 cursor-not-allowed' 
                                  : 'text-emerald-400 hover:underline'
                              }`}
                              onClick={(e) => phone.is_dnc && e.preventDefault()}
                            >
                              <Phone size={12} />
                              {phone.number}
                              {phone.type && <span className="text-xs opacity-60">({phone.type})</span>}
                            </a>
                            {phone.is_dnc && (
                              <span className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle size={10} />
                                DNC
                              </span>
                            )}
                            {!phone.is_dnc && (
                              <button
                                onClick={() => setShowCallModal(true)}
                                className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              >
                                Log Call
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Emails */}
                    {contact.emails && contact.emails.length > 0 && (
                      <div className="space-y-1">
                        {contact.emails.map(email => (
                          <div key={email.id} className="flex items-center gap-2">
                            <a
                              href={`mailto:${email.email}`}
                              className="flex items-center gap-2 text-sm text-amber-400 hover:underline"
                            >
                              <Mail size={12} />
                              {email.email}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCallModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <PhoneCall size={18} />
              Log Call
            </button>
            <button
              onClick={() => setShowNoteModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              <Plus size={18} />
              Add Note
            </button>
          </div>

          {/* Activity History */}
          <div className="bg-navy-900/50 rounded-xl p-4">
            <h3 className="text-sm text-white/40 uppercase tracking-wide mb-4">Activity History</h3>

            {loadingActivities ? (
              <div className="text-white/50 text-center py-4">Loading activities...</div>
            ) : activities.length === 0 ? (
              <div className="text-white/50 text-center py-4">No activities yet</div>
            ) : (
              <div className="space-y-3">
                {activities.map(activity => {
                  const Icon = activityIcons[activity.activity_type] || FileText
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-white/60" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white capitalize">
                            {activity.activity_type}
                          </span>
                          {activity.outcome && (
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
                              {activity.outcome.replace(':', ' → ')}
                            </span>
                          )}
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-white/60 mt-1">{activity.notes}</p>
                        )}
                        <div className="text-xs text-white/40 mt-1">
                          {formatDate(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-navy-800 rounded-xl border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">Log Call</h3>
              <button onClick={() => setShowCallModal(false)} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => {
                    setCallOutcome(e.target.value)
                    setCallSubOutcome('')
                  }}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select outcome...</option>
                  {callOutcomes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {callOutcome === 'answered' && (
                <div>
                  <label className="block text-sm text-white/50 mb-2">Result</label>
                  <select
                    value={callSubOutcome}
                    onChange={(e) => setCallSubOutcome(e.target.value)}
                    className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Select result...</option>
                    {answeredOutcomes.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-white/50 mb-2">Notes</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about the call..."
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30"
                />
              </div>

              <button
                onClick={handleLogCall}
                disabled={!callOutcome || loggingCall}
                className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {loggingCall ? 'Saving...' : 'Save Call'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-navy-800 rounded-xl border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">Add Note</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                placeholder="Enter your note..."
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30"
                autoFocus
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim() || savingNote}
                className="w-full px-4 py-2 bg-norv text-white rounded-lg font-medium hover:bg-norv/80 disabled:opacity-50 transition-colors"
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
