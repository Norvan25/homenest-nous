'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Users,
  Phone,
  MessageSquare,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronRight,
  MapPin,
  DollarSign,
  Home,
  Flame,
  AlertCircle,
  Trash2,
  LogOut,
  CheckSquare,
  Square
} from 'lucide-react'
import { LeadDetailPanel } from './LeadDetailPanel'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { CallQueueButton, CallQueuePanel } from '@/components/call-queue'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types
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
  contacts?: any[]
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

interface Stats {
  total: number
  new: number
  contacted: number
  interested: number
  appointment: number
  closed: number
  dead: number
}

interface Props {
  initialStats: Stats
  initialLeads: CRMLead[]
}

// Status colors
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'New' },
  contacted: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Contacted' },
  interested: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Interested' },
  appointment: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Appointment' },
  closed: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Closed' },
  dead: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Dead' },
}

// Priority colors
const priorityColors: Record<string, { bg: string; text: string; icon: any }> = {
  hot: { bg: 'bg-red-500/20', text: 'text-red-400', icon: Flame },
  normal: { bg: 'bg-white/10', text: 'text-white/60', icon: null },
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: null },
}

export default function NorCRMApp({ initialStats, initialLeads }: Props) {
  const { showToast } = useToast()
  const [leads, setLeads] = useState<CRMLead[]>(initialLeads)
  const [stats, setStats] = useState<Stats>(initialStats)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFollowUpToday, setShowFollowUpToday] = useState(false)
  
  // Selected lead for detail panel
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)

  // Selection state for bulk actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())

  // Confirm dialogs
  const [removeFromCRMConfirm, setRemoveFromCRMConfirm] = useState<CRMLead | null>(null)
  const [deleteCompletelyConfirm, setDeleteCompletelyConfirm] = useState<CRMLead | null>(null)
  const [bulkRemoveConfirm, setBulkRemoveConfirm] = useState(false)
  const [bulkStatusModal, setBulkStatusModal] = useState(false)
  const [bulkPriorityModal, setBulkPriorityModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Call Queue
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [isAddingToQueue, setIsAddingToQueue] = useState(false)

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false
      
      // Priority filter
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false
      
      // Follow-up today filter
      if (showFollowUpToday) {
        if (!lead.next_action_date) return false
        const today = new Date().toISOString().split('T')[0]
        const actionDate = lead.next_action_date.split('T')[0]
        if (actionDate > today) return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const address = lead.property?.street_address?.toLowerCase() || ''
        const city = lead.property?.city?.toLowerCase() || ''
        if (!address.includes(query) && !city.includes(query)) return false
      }
      
      return true
    })
  }, [leads, statusFilter, priorityFilter, searchQuery, showFollowUpToday])

  const formatPrice = (price: number | null) => {
    if (!price) return '—'
    return '$' + price.toLocaleString()
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isOverdue = (date: string | null) => {
    if (!date) return false
    const today = new Date().toISOString().split('T')[0]
    return date.split('T')[0] < today
  }

  const isToday = (date: string | null) => {
    if (!date) return false
    const today = new Date().toISOString().split('T')[0]
    return date.split('T')[0] === today
  }

  // Handle lead update from detail panel
  const handleLeadUpdate = (updatedLead: CRMLead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l))
    setSelectedLead(updatedLead)
    refreshStats()
  }

  // Refresh stats
  const refreshStats = () => {
    const newStats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      interested: leads.filter(l => l.status === 'interested').length,
      appointment: leads.filter(l => l.status === 'appointment').length,
      closed: leads.filter(l => l.status === 'closed').length,
      dead: leads.filter(l => l.status === 'dead').length,
    }
    setStats(newStats)
  }

  // Selection handlers
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        newSet.add(leadId)
      }
      return newSet
    })
  }

  const selectAllVisible = () => {
    const allIds = filteredLeads.map(l => l.id)
    setSelectedLeadIds(new Set(allIds))
  }

  const clearSelection = () => {
    setSelectedLeadIds(new Set())
  }

  // Remove from CRM (keep property in NorLead)
  const handleRemoveFromCRM = async () => {
    if (!removeFromCRMConfirm) return
    setIsSubmitting(true)

    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', removeFromCRMConfirm.id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to remove from CRM: ' + error.message, 'error')
      return
    }

    setLeads(prev => prev.filter(l => l.id !== removeFromCRMConfirm.id))
    setSelectedLead(null)
    showToast('Lead removed from CRM', 'success')
    setRemoveFromCRMConfirm(null)
    refreshStats()
  }

  // Delete completely (property + CRM lead)
  const handleDeleteCompletely = async () => {
    if (!deleteCompletelyConfirm) return
    setIsSubmitting(true)

    // Delete CRM lead first
    await supabase.from('crm_leads').delete().eq('id', deleteCompletelyConfirm.id)

    // Delete property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', deleteCompletelyConfirm.property_id)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to delete property: ' + error.message, 'error')
      return
    }

    setLeads(prev => prev.filter(l => l.id !== deleteCompletelyConfirm.id))
    setSelectedLead(null)
    showToast('Property deleted completely', 'success')
    setDeleteCompletelyConfirm(null)
    refreshStats()
  }

  // Bulk remove from CRM
  const handleBulkRemove = async () => {
    if (selectedLeadIds.size === 0) return
    setIsSubmitting(true)

    const ids = Array.from(selectedLeadIds)

    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .in('id', ids)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to remove leads: ' + error.message, 'error')
      return
    }

    setLeads(prev => prev.filter(l => !selectedLeadIds.has(l.id)))
    clearSelection()
    showToast(`${ids.length} leads removed from CRM`, 'success')
    setBulkRemoveConfirm(false)
    refreshStats()
  }

  // Bulk change status
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedLeadIds.size === 0) return
    setIsSubmitting(true)

    const ids = Array.from(selectedLeadIds)

    const { error } = await supabase
      .from('crm_leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in('id', ids)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to update status: ' + error.message, 'error')
      return
    }

    setLeads(prev => prev.map(l => 
      selectedLeadIds.has(l.id) ? { ...l, status: newStatus } : l
    ))
    clearSelection()
    showToast(`${ids.length} leads updated to ${newStatus}`, 'success')
    setBulkStatusModal(false)
    refreshStats()
  }

  // Bulk change priority
  const handleBulkPriorityChange = async (newPriority: string) => {
    if (selectedLeadIds.size === 0) return
    setIsSubmitting(true)

    const ids = Array.from(selectedLeadIds)

    const { error } = await supabase
      .from('crm_leads')
      .update({ priority: newPriority, updated_at: new Date().toISOString() })
      .in('id', ids)

    setIsSubmitting(false)

    if (error) {
      showToast('Failed to update priority: ' + error.message, 'error')
      return
    }

    setLeads(prev => prev.map(l => 
      selectedLeadIds.has(l.id) ? { ...l, priority: newPriority } : l
    ))
    clearSelection()
    showToast(`${ids.length} leads updated to ${newPriority} priority`, 'success')
    setBulkPriorityModal(false)
  }

  // Add to Call Queue
  const handleAddToQueue = async (queueNumber: number = 1) => {
    if (selectedLeadIds.size === 0) return
    setIsAddingToQueue(true)

    try {
      const response = await fetch('/api/call-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadIds: Array.from(selectedLeadIds),
          queueNumber 
        }),
      })

      const data = await response.json()

      if (data.success) {
        showToast(`Added to Q${queueNumber}: ${data.message}`, 'success')
        setIsQueueOpen(true) // Open queue panel
        clearSelection()
      } else {
        showToast(data.error || 'Failed to add to queue', 'error')
      }
    } catch (error) {
      showToast('Failed to add to queue', 'error')
    }

    setIsAddingToQueue(false)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-norv" />
              <h1 className="text-2xl font-bold text-white">NorCRM</h1>
            </div>
            <p className="text-white/50">
              Manage your {stats.total} active leads
            </p>
          </div>
          <button
            onClick={() => setIsQueueOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition"
          >
            <Phone size={18} />
            <span>Call Queue</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <StatCard 
          label="Total" 
          value={stats.total} 
          icon={<Users size={18} />}
          color="white"
          onClick={() => setStatusFilter('all')}
          active={statusFilter === 'all'}
        />
        <StatCard 
          label="New" 
          value={stats.new} 
          icon={<Star size={18} />}
          color="blue"
          onClick={() => setStatusFilter('new')}
          active={statusFilter === 'new'}
        />
        <StatCard 
          label="Contacted" 
          value={stats.contacted} 
          icon={<Phone size={18} />}
          color="yellow"
          onClick={() => setStatusFilter('contacted')}
          active={statusFilter === 'contacted'}
        />
        <StatCard 
          label="Interested" 
          value={stats.interested} 
          icon={<MessageSquare size={18} />}
          color="green"
          onClick={() => setStatusFilter('interested')}
          active={statusFilter === 'interested'}
        />
        <StatCard 
          label="Appointment" 
          value={stats.appointment} 
          icon={<Calendar size={18} />}
          color="cyan"
          onClick={() => setStatusFilter('appointment')}
          active={statusFilter === 'appointment'}
        />
        <StatCard 
          label="Closed" 
          value={stats.closed} 
          icon={<CheckCircle size={18} />}
          color="purple"
          onClick={() => setStatusFilter('closed')}
          active={statusFilter === 'closed'}
        />
        <StatCard 
          label="Dead" 
          value={stats.dead} 
          icon={<XCircle size={18} />}
          color="gray"
          onClick={() => setStatusFilter('dead')}
          active={statusFilter === 'dead'}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-navy-800 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by address..."
              className="w-full bg-navy-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-norv/50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-norv/50"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="appointment">Appointment</option>
            <option value="closed">Closed</option>
            <option value="dead">Dead</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-norv/50"
          >
            <option value="all">All Priority</option>
            <option value="hot">🔥 Hot</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Follow-up Today */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFollowUpToday}
              onChange={(e) => setShowFollowUpToday(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-navy-900 text-norv focus:ring-norv/50"
            />
            <span className="text-sm text-white/70">Follow-up Due</span>
          </label>

          {/* Results Count */}
          <div className="text-sm text-white/50">
            <span className="text-white font-medium">{filteredLeads.length}</span> leads
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeadIds.size > 0 && (
        <div className="sticky top-0 z-20 bg-navy-900/95 backdrop-blur border border-norv/30 rounded-xl p-4 mb-6 shadow-lg shadow-norv/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-white font-medium">{selectedLeadIds.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <CallQueueButton
                selectedCount={selectedLeadIds.size}
                onAddToQueue={handleAddToQueue}
                disabled={isAddingToQueue}
              />
              <button
                onClick={() => setBulkStatusModal(true)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Change Status
              </button>
              <button
                onClick={() => setBulkPriorityModal(true)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Change Priority
              </button>
              <button
                onClick={() => setBulkRemoveConfirm(true)}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Remove from CRM
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select All / Actions Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/50">
          Showing <span className="text-white font-medium">{filteredLeads.length}</span> leads
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAllVisible}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white border border-white/10 text-sm"
          >
            <CheckSquare size={14} />
            Select All Visible
          </button>
        </div>
      </div>

      {/* Lead List */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="bg-navy-800 border border-white/10 rounded-xl p-12 text-center">
            <Users size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
            <p className="text-white/50">
              {leads.length === 0 
                ? 'Transfer leads from NorLead to get started'
                : 'Try adjusting your filters'
              }
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <LeadCard 
              key={lead.id}
              lead={lead}
              isSelected={selectedLeadIds.has(lead.id)}
              onToggleSelect={() => toggleLeadSelection(lead.id)}
              onClick={() => setSelectedLead(lead)}
              onRemoveFromCRM={() => setRemoveFromCRMConfirm(lead)}
              onDeleteCompletely={() => setDeleteCompletelyConfirm(lead)}
              formatPrice={formatPrice}
              formatDate={formatDate}
              isOverdue={isOverdue}
              isToday={isToday}
            />
          ))
        )}
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
          onRemoveFromCRM={() => setRemoveFromCRMConfirm(selectedLead)}
          onDeleteCompletely={() => setDeleteCompletelyConfirm(selectedLead)}
        />
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={!!removeFromCRMConfirm}
        onClose={() => setRemoveFromCRMConfirm(null)}
        onConfirm={handleRemoveFromCRM}
        title="Remove from CRM"
        message={
          <div>
            <p>Remove <strong>{removeFromCRMConfirm?.property?.street_address}</strong> from CRM?</p>
            <p className="mt-2 text-white/60">The property will still be available in NorLead.</p>
          </div>
        }
        confirmLabel="Remove from CRM"
        variant="warning"
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deleteCompletelyConfirm}
        onClose={() => setDeleteCompletelyConfirm(null)}
        onConfirm={handleDeleteCompletely}
        title="Delete Completely"
        message={
          <div>
            <p>Delete <strong>{deleteCompletelyConfirm?.property?.street_address}</strong> completely?</p>
            <p className="mt-2 text-red-400">This removes it from both NorLead and CRM. This cannot be undone.</p>
          </div>
        }
        confirmLabel="Delete Completely"
        variant="danger"
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={bulkRemoveConfirm}
        onClose={() => setBulkRemoveConfirm(false)}
        onConfirm={handleBulkRemove}
        title="Remove from CRM"
        message={`Remove ${selectedLeadIds.size} leads from CRM? Properties will still be available in NorLead.`}
        confirmLabel={`Remove ${selectedLeadIds.size} Leads`}
        variant="warning"
        isLoading={isSubmitting}
      />

      {/* Bulk Status Modal */}
      {bulkStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setBulkStatusModal(false)} />
          <div className="relative bg-navy-800 border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Change Status</h3>
            <p className="text-white/60 text-sm mb-4">Set status for {selectedLeadIds.size} selected leads</p>
            <div className="space-y-2">
              {Object.entries(statusColors).map(([value, { label, text }]) => (
                <button
                  key={value}
                  onClick={() => handleBulkStatusChange(value)}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-lg text-left hover:bg-white/10 transition-colors ${text}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setBulkStatusModal(false)}
              className="w-full mt-4 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Priority Modal */}
      {bulkPriorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setBulkPriorityModal(false)} />
          <div className="relative bg-navy-800 border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Change Priority</h3>
            <p className="text-white/60 text-sm mb-4">Set priority for {selectedLeadIds.size} selected leads</p>
            <div className="space-y-2">
              {Object.entries(priorityColors).map(([value, { text }]) => (
                <button
                  key={value}
                  onClick={() => handleBulkPriorityChange(value)}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-lg text-left hover:bg-white/10 transition-colors ${text}`}
                >
                  {value === 'hot' ? '🔥 Hot' : value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setBulkPriorityModal(false)}
              className="w-full mt-4 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Call Queue Panel */}
      <CallQueuePanel 
        isOpen={isQueueOpen} 
        onClose={() => setIsQueueOpen(false)} 
      />
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color,
  onClick,
  active
}: { 
  label: string
  value: number
  icon: React.ReactNode
  color: string
  onClick: () => void
  active: boolean
}) {
  const colorMap: Record<string, string> = {
    white: 'text-white',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    gray: 'text-gray-400',
  }

  return (
    <button
      onClick={onClick}
      className={`bg-navy-800 border rounded-xl p-4 text-left transition-all ${
        active 
          ? 'border-norv/50 ring-1 ring-norv/30' 
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className={`mb-2 ${colorMap[color]}`}>{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </button>
  )
}

// Lead Card Component
function LeadCard({
  lead,
  isSelected,
  onToggleSelect,
  onClick,
  onRemoveFromCRM,
  onDeleteCompletely,
  formatPrice,
  formatDate,
  isOverdue,
  isToday
}: {
  lead: CRMLead
  isSelected: boolean
  onToggleSelect: () => void
  onClick: () => void
  onRemoveFromCRM: () => void
  onDeleteCompletely: () => void
  formatPrice: (p: number | null) => string
  formatDate: (d: string | null) => string
  isOverdue: (d: string | null) => boolean
  isToday: (d: string | null) => boolean
}) {
  const status = statusColors[lead.status] || statusColors.new
  const priority = priorityColors[lead.priority] || priorityColors.normal

  return (
    <div
      className={`bg-navy-800 border rounded-xl p-4 transition-colors group ${
        isSelected ? 'border-norv/50 ring-1 ring-norv/30' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
          className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected 
              ? 'bg-norv border-norv' 
              : 'border-white/30 hover:border-white/50'
          }`}
        >
          {isSelected && <CheckCircle size={14} className="text-white" />}
        </button>

        {/* Main content - clickable */}
        <button
          onClick={onClick}
          className="flex-1 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Address */}
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-norv flex-shrink-0" />
                <span className="font-semibold text-white">
                  {lead.property?.street_address || 'Unknown Address'}
                </span>
                <span className="text-white/50">
                  {lead.property?.city}, {lead.property?.state}
                </span>
              </div>

              {/* Details Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {/* Price */}
                <div className="flex items-center gap-1 text-white/70">
                  <DollarSign size={14} />
                  <span>{formatPrice(lead.property?.price || null)}</span>
                </div>

                {/* Status Badge */}
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>

                {/* Priority Badge */}
                {lead.priority === 'hot' && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${priority.bg} ${priority.text}`}>
                    <Flame size={12} />
                    Hot
                  </span>
                )}

                {/* Callable Phones */}
                {lead.callablePhones > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Phone size={14} />
                    <span>{lead.callablePhones}</span>
                  </div>
                )}

                {/* Last Activity */}
                {lead.last_activity_date && (
                  <div className="flex items-center gap-1 text-white/50">
                    <Clock size={14} />
                    <span>Last: {formatDate(lead.last_activity_date)}</span>
                  </div>
                )}

                {/* Next Action Date */}
                {lead.next_action_date && (
                  <div className={`flex items-center gap-1 ${
                    isOverdue(lead.next_action_date) 
                      ? 'text-red-400' 
                      : isToday(lead.next_action_date)
                      ? 'text-yellow-400'
                      : 'text-white/50'
                  }`}>
                    {isOverdue(lead.next_action_date) && <AlertCircle size={14} />}
                    <Calendar size={14} />
                    <span>
                      {isOverdue(lead.next_action_date) 
                        ? 'Overdue' 
                        : isToday(lead.next_action_date)
                        ? 'Today'
                        : formatDate(lead.next_action_date)
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Next Action */}
              {lead.next_action && (
                <div className="mt-2 text-sm text-white/50 truncate">
                  Next: {lead.next_action}
                </div>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight size={20} className="text-white/30 group-hover:text-white/60 transition-colors" />
          </div>
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemoveFromCRM()
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-amber-400 transition-colors"
            title="Remove from CRM"
          >
            <LogOut size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteCompletely()
            }}
            className="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
            title="Delete Completely"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
