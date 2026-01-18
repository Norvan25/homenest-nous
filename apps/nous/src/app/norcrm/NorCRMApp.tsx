'use client'

import { useState, useMemo } from 'react'
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
  AlertCircle
} from 'lucide-react'
import { LeadDetailPanel } from './LeadDetailPanel'

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
  const [leads, setLeads] = useState<CRMLead[]>(initialLeads)
  const [stats, setStats] = useState<Stats>(initialStats)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFollowUpToday, setShowFollowUpToday] = useState(false)
  
  // Selected lead for detail panel
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)

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
  }

  // Refresh stats
  const refreshStats = async () => {
    // In a real app, you'd refetch from the server
    // For now, calculate from leads
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-norv" />
          <h1 className="text-2xl font-bold text-white">NorCRM</h1>
        </div>
        <p className="text-white/50">
          Manage your {stats.total} active leads
        </p>
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
              onClick={() => setSelectedLead(lead)}
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
        />
      )}
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
  onClick,
  formatPrice,
  formatDate,
  isOverdue,
  isToday
}: {
  lead: CRMLead
  onClick: () => void
  formatPrice: (p: number | null) => string
  formatDate: (d: string | null) => string
  isOverdue: (d: string | null) => boolean
  isToday: (d: string | null) => boolean
}) {
  const status = statusColors[lead.status] || statusColors.new
  const priority = priorityColors[lead.priority] || priorityColors.normal

  return (
    <button
      onClick={onClick}
      className="w-full bg-navy-800 border border-white/10 rounded-xl p-4 text-left hover:border-white/20 transition-colors group"
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
  )
}
