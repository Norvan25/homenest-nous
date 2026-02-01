'use client'

import { useState, useMemo } from 'react'
import { 
  Building2, 
  Phone, 
  Mail, 
  Sparkles, 
  Search, 
  ChevronUp, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  MapPin,
  Home,
  DollarSign,
  Clock,
  User,
  ExternalLink
} from 'lucide-react'
import { LeadDetailModal } from './LeadDetailModal'
import type { LeadWithContacts, LeadsStats, SortField, SortDirection, Contact } from '@/lib/types'

interface CityOption {
  city: string
  count: number
}

interface Props {
  initialStats: LeadsStats
  initialLeads: LeadWithContacts[]
  cities: CityOption[]
}

export function LeadsDashboard({ initialStats, initialLeads, cities }: Props) {
  // State
  const [leads] = useState<LeadWithContacts[]>(initialLeads)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minBeds, setMinBeds] = useState('')
  const [minBaths, setMinBaths] = useState('')
  const [hasCallable, setHasCallable] = useState(false)
  const [hasEmail, setHasEmail] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLead, setSelectedLead] = useState<LeadWithContacts | null>(null)
  const [showFilters, setShowFilters] = useState(true)

  const ITEMS_PER_PAGE = 25

  // Compute callable/email counts for each lead
  const leadsWithCounts = useMemo(() => {
    return leads.map(lead => {
      let callableCount = 0
      let totalPhones = 0
      let emailCount = 0

      lead.contacts?.forEach((contact: Contact) => {
        contact.phones?.forEach(phone => {
          totalPhones++
          if (!phone.is_dnc) callableCount++
        })
        emailCount += contact.emails?.length || 0
      })

      return {
        ...lead,
        callableCount,
        totalPhones,
        emailCount,
        ownerName: lead.contacts?.[0]?.name || 'Unknown'
      }
    })
  }, [leads])

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leadsWithCounts.filter(lead => {
      // City filter
      if (selectedCities.length > 0 && !selectedCities.includes(lead.city)) {
        return false
      }

      // Price filters
      if (minPrice && lead.price && lead.price < parseInt(minPrice)) return false
      if (maxPrice && lead.price && lead.price > parseInt(maxPrice)) return false

      // Beds filter
      if (minBeds && lead.beds && lead.beds < parseInt(minBeds)) return false

      // Baths filter
      if (minBaths && lead.baths && lead.baths < parseFloat(minBaths)) return false

      // Has callable phone
      if (hasCallable && lead.callableCount === 0) return false

      // Has email
      if (hasEmail && lead.emailCount === 0) return false

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchAddress = lead.street_address?.toLowerCase().includes(query)
        const matchCity = lead.city?.toLowerCase().includes(query)
        const matchOwner = lead.ownerName?.toLowerCase().includes(query)
        if (!matchAddress && !matchCity && !matchOwner) return false
      }

      return true
    })
  }, [leadsWithCounts, selectedCities, minPrice, maxPrice, minBeds, minBaths, hasCallable, hasEmail, searchQuery])

  // Sort leads
  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads].sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortField) {
        case 'price':
          aVal = a.price || 0
          bVal = b.price || 0
          break
        case 'dom':
          aVal = a.dom || 0
          bVal = b.dom || 0
          break
        case 'city':
          aVal = a.city || ''
          bVal = b.city || ''
          break
        case 'beds':
          aVal = a.beds || 0
          bVal = b.beds || 0
          break
        case 'created_at':
        default:
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })

    return sorted
  }, [filteredLeads, sortField, sortDirection])

  // Paginate
  const totalPages = Math.ceil(sortedLeads.length / ITEMS_PER_PAGE)
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    )
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedCities([])
    setMinPrice('')
    setMaxPrice('')
    setMinBeds('')
    setMinBaths('')
    setHasCallable(false)
    setHasEmail(false)
    setSearchQuery('')
    setCurrentPage(1)
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '—'
    return '$' + price.toLocaleString()
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={14} className="opacity-30" />
    return sortDirection === 'asc' 
      ? <ChevronUp size={14} className="text-cyan-400" />
      : <ChevronDown size={14} className="text-cyan-400" />
  }

  const activeFiltersCount = [
    selectedCities.length > 0,
    minPrice,
    maxPrice,
    minBeds,
    minBaths,
    hasCallable,
    hasEmail,
    searchQuery
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Leads"
          value={initialStats.totalLeads}
          icon={<Building2 className="text-cyan-400" />}
          color="cyan"
        />
        <StatsCard
          label="Callable Phones"
          value={initialStats.callablePhones}
          icon={<Phone className="text-emerald-400" />}
          color="emerald"
          subtitle="Non-DNC numbers"
        />
        <StatsCard
          label="Total Emails"
          value={initialStats.totalEmails}
          icon={<Mail className="text-amber-400" />}
          color="amber"
        />
        <StatsCard
          label="New This Week"
          value={initialStats.newLeads}
          icon={<Sparkles className="text-violet-400" />}
          color="violet"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
        {/* Filter Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Filter size={18} />
              <span className="font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search address or owner..."
                className="w-64 bg-navy-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Results Count */}
            <div className="text-sm text-white/50">
              <span className="text-white font-medium">{sortedLeads.length}</span> leads
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="p-4 bg-navy-900/50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* City Multi-Select */}
              <div className="col-span-2">
                <label className="block text-xs text-white/50 mb-2 uppercase tracking-wide">
                  Cities
                </label>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {cities.slice(0, 15).map(({ city, count }) => (
                    <button
                      key={city}
                      onClick={() => toggleCity(city)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                        selectedCities.includes(city)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {city} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs text-white/50 mb-2 uppercase tracking-wide">
                  Min Price
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="$0"
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-2 uppercase tracking-wide">
                  Max Price
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="$10M"
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Beds/Baths */}
              <div>
                <label className="block text-xs text-white/50 mb-2 uppercase tracking-wide">
                  Min Beds
                </label>
                <select
                  value={minBeds}
                  onChange={(e) => {
                    setMinBeds(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-2 uppercase tracking-wide">
                  Min Baths
                </label>
                <select
                  value={minBaths}
                  onChange={(e) => {
                    setMinBaths(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-white/40 uppercase tracking-wide">Quick:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCallable}
                  onChange={(e) => {
                    setHasCallable(e.target.checked)
                    setCurrentPage(1)
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-navy-900 text-cyan-500 focus:ring-cyan-500/50"
                />
                <span className="text-sm text-white/70">Has Callable Phone</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEmail}
                  onChange={(e) => {
                    setHasEmail(e.target.checked)
                    setCurrentPage(1)
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-navy-900 text-cyan-500 focus:ring-cyan-500/50"
                />
                <span className="text-sm text-white/70">Has Email</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-navy-900/50">
                <th className="text-left p-4">
                  <button 
                    onClick={() => handleSort('city')}
                    className="flex items-center gap-1 text-xs uppercase tracking-wide text-white/50 hover:text-white"
                  >
                    Address <SortIcon field="city" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button 
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 text-xs uppercase tracking-wide text-white/50 hover:text-white"
                  >
                    Price <SortIcon field="price" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button 
                    onClick={() => handleSort('beds')}
                    className="flex items-center gap-1 text-xs uppercase tracking-wide text-white/50 hover:text-white"
                  >
                    Beds/Baths <SortIcon field="beds" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <span className="text-xs uppercase tracking-wide text-white/50">Owner</span>
                </th>
                <th className="text-left p-4">
                  <span className="text-xs uppercase tracking-wide text-white/50">Phones</span>
                </th>
                <th className="text-left p-4">
                  <span className="text-xs uppercase tracking-wide text-white/50">Emails</span>
                </th>
                <th className="text-left p-4">
                  <button 
                    onClick={() => handleSort('dom')}
                    className="flex items-center gap-1 text-xs uppercase tracking-wide text-white/50 hover:text-white"
                  >
                    DOM <SortIcon field="dom" />
                  </button>
                </th>
                <th className="text-right p-4">
                  <span className="text-xs uppercase tracking-wide text-white/50">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-white/50">
                    No leads match your filters
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-white">{lead.street_address}</div>
                          <div className="text-sm text-white/50">{lead.city}, {lead.state} {lead.zip}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-white">{formatPrice(lead.price)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-white/70">
                        <Home size={14} />
                        <span>{lead.beds || '—'} / {lead.baths || '—'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-white/40" />
                        <span className="text-white/70 truncate max-w-[120px]">
                          {lead.ownerName}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className={lead.callableCount > 0 ? 'text-emerald-400' : 'text-white/40'} />
                        <span className={lead.callableCount > 0 ? 'text-emerald-400' : 'text-white/40'}>
                          {lead.callableCount}
                        </span>
                        {lead.totalPhones > lead.callableCount && (
                          <span className="text-white/30 text-xs">
                            ({lead.totalPhones} total)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className={lead.emailCount > 0 ? 'text-amber-400' : 'text-white/40'} />
                        <span className={lead.emailCount > 0 ? 'text-amber-400' : 'text-white/40'}>
                          {lead.emailCount}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-white/70">
                        <Clock size={14} />
                        <span>{lead.dom || '—'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLead(lead)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
                      >
                        <ExternalLink size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10 bg-navy-900/50">
            <div className="text-sm text-white/50">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedLeads.length)} of {sortedLeads.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/5 text-white/50 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
        />
      )}
    </div>
  )
}

// Stats Card Component
function StatsCard({ 
  label, 
  value, 
  icon, 
  color, 
  subtitle 
}: { 
  label: string
  value: number
  icon: React.ReactNode
  color: 'cyan' | 'emerald' | 'amber' | 'violet'
  subtitle?: string
}) {
  const bgColors = {
    cyan: 'bg-cyan-500/10',
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    violet: 'bg-violet-500/10'
  }

  return (
    <div className="bg-navy-800 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${bgColors[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-white/50 mt-1">
        {label}
        {subtitle && <span className="text-white/30"> · {subtitle}</span>}
      </div>
    </div>
  )
}
