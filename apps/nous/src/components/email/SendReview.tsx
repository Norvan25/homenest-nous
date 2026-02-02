'use client'

import { ChevronLeft, Send, Mail, FileText, User } from 'lucide-react'
import type { Lead, Scenario } from '@/app/(app)/email/page'

interface SendReviewProps {
  leads: Lead[]
  scenario: Scenario
  sending: boolean
  onBack: () => void
  onSend: () => void
}

export default function SendReview({
  leads,
  scenario,
  sending,
  onBack,
  onSend
}: SendReviewProps) {
  const previewLeads = leads.slice(0, 5)
  const remainingCount = leads.length - 5

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-medium text-white mb-1">Review & Send</h2>
        <p className="text-sm text-white/50">Confirm your bulk email details</p>
      </div>

      {/* Summary */}
      <div className="p-6 border-b border-white/10 bg-navy-900/50">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">
          Summary
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-norv/20 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-norv" />
            </div>
            <div>
              <div className="text-white font-medium">{leads.length} emails will be sent</div>
              <div className="text-sm text-white/50">AI personalizes each email</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-white font-medium">{scenario.name}</div>
              <div className="text-sm text-white/50">{scenario.description}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="text-white font-medium">From: Suzanna Saharyan</div>
              <div className="text-sm text-white/50">nadia@norvan.io</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipients Preview */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
          Recipients
        </h3>
        <div className="space-y-2">
          {previewLeads.map((lead, index) => {
            const contact = lead.contacts[0]
            const email = contact?.emails[0]
            return (
              <div key={lead.id} className="flex items-center gap-3 py-2">
                <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs text-white/50">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {contact?.name || 'Unknown'}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {email?.email} • {lead.street_address}
                  </div>
                </div>
              </div>
            )
          })}
          {remainingCount > 0 && (
            <div className="py-2 text-sm text-white/40">
              ... and {remainingCount} more
            </div>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-400">
            <strong>Note:</strong> Emails take ~2-3 seconds each to generate. 
            For {leads.length} emails, this will take approximately {Math.ceil(leads.length * 2.5)} seconds.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={sending}
          className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onSend}
          disabled={sending}
          className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send {leads.length} Emails
            </>
          )}
        </button>
      </div>
    </>
  )
}
