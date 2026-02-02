'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronRight, Users } from 'lucide-react'
import type { Lead } from '@/app/(app)/email/page'
import LeadCard from './LeadCard'

interface LeadSelectorProps {
  leads: Lead[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  loading: boolean
  onNext: () => void
}

export default function LeadSelector({
  leads,
  selectedIds,
  onSelectionChange,
  loading,
  onNext
}: LeadSelectorProps) {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string>('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  // Get unique cities for filter
  const cities = useMemo(() => {
    const citySet = new Set(leads.map(l => l.city).filter(Boolean))
    return Array.from(citySet).sort()
  }, [leads])

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesAddress = lead.street_address?.toLowerCase().includes(searchLower)
        const matchesCity = lead.city?.toLowerCase().includes(searchLower)
        const matchesContact = lead.contacts?.some(c => 
          c.name?.toLowerCase().includes(searchLower) ||
          c.emails?.some(e => e.email?.toLowerCase().includes(searchLower))
        )
        if (!matchesAddress && !matchesCity && !matchesContact) return false
      }

      // City filter
      if (cityFilter && lead.city !== cityFilter) return false

      // Price filters
      if (minPrice && lead.price < parseInt(minPrice)) return false
      if (maxPrice && lead.price > parseInt(maxPrice)) return false

      return true
    })
  }, [leads, search, cityFilter, minPrice, maxPrice])

  // Toggle single lead
  function toggleLead(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    onSelectionChange(newSet)
  }

  // Select all filtered leads
  function selectAll() {
    const allSelected = filteredLeads.every(l => selectedIds.has(l.id))
    if (allSelected) {
      // Deselect all filtered
      const newSet = new Set(selectedIds)
      filteredLeads.forEach(l => newSet.delete(l.id))
      onSelectionChange(newSet)
    } else {
      // Select all filtered
      const newSet = new Set(selectedIds)
      filteredLeads.forEach(l => newSet.add(l.id))
      onSelectionChange(newSet)
    }
  }

  const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id))

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-medium text-white mb-1">Select Leads</h2>
        <p className="text-sm text-white/50">Choose which leads to send emails to</p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-white/10 bg-navy-900/50">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search address, name, or email..."
              className="w-full pl-10 pr-4 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:border-norv focus:outline-none"
            />
          </div>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white text-sm focus:border-norv focus:outline-none"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Price Range */}
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min Price"
            className="w-28 px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:border-norv focus:outline-none"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max Price"
            className="w-28 px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:border-norv focus:outline-none"
          />
        </div>
      </div>

      {/* Select All */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={selectAll}
            className="w-4 h-4 rounded border-white/20 bg-navy-900 text-norv focus:ring-norv focus:ring-offset-0"
          />
          <span className="text-sm text-white">
            Select All ({filteredLeads.length} leads with email)
          </span>
        </label>
        {selectedIds.size > 0 && (
          <span className="text-sm text-norv">
            {selectedIds.size} selected
          </span>
        )}
      </div>

      {/* Lead List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-white/50">
            Loading leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/50">No leads found matching your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                selected={selectedIds.has(lead.id)}
                onToggle={() => toggleLead(lead.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex items-center justify-end">
        <button
          onClick={onNext}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Select Scenario
          <ChevronRight className="w-4 h-4" />
          {selectedIds.size > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded text-xs">
              {selectedIds.size}
            </span>
          )}
        </button>
      </div>
    </>
  )
}
