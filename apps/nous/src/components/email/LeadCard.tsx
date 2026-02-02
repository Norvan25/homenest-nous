'use client'

import { Mail, Home, Calendar } from 'lucide-react'
import type { Lead } from '@/app/(app)/email/page'

interface LeadCardProps {
  lead: Lead
  selected: boolean
  onToggle: () => void
}

export default function LeadCard({ lead, selected, onToggle }: LeadCardProps) {
  const contact = lead.contacts?.[0]
  const email = contact?.emails?.[0]

  if (!contact || !email) return null

  return (
    <div 
      className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${
        selected ? 'bg-norv/10' : ''
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 w-4 h-4 rounded border-white/20 bg-navy-900 text-norv focus:ring-norv focus:ring-offset-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{contact.name || 'Unknown'}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-white/60 mb-2">
            <Home className="w-3.5 h-3.5" />
            <span>{lead.street_address}, {lead.city}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-white/80">
              ${lead.price?.toLocaleString()}
            </span>
            <span className="text-white/50">
              {lead.beds}bd/{lead.baths}ba
            </span>
            <span className="flex items-center gap-1 text-white/50">
              <Calendar className="w-3 h-3" />
              {lead.dom} DOM
            </span>
            <span className="flex items-center gap-1 text-norv">
              <Mail className="w-3 h-3" />
              {email.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
