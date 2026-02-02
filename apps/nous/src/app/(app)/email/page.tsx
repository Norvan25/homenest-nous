'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Mail, CheckCircle, ArrowLeft, ArrowRight, Send, History } from 'lucide-react'
import Link from 'next/link'
import LeadSelector from '@/components/email/LeadSelector'
import ScenarioSelector from '@/components/email/ScenarioSelector'
import SendReview from '@/components/email/SendReview'

export interface Lead {
  id: string
  street_address: string
  city: string
  price: number
  beds: number
  baths: number
  dom: number
  sqft: number
  contacts: {
    id: string
    name: string
    emails: {
      id: string
      email: string
    }[]
  }[]
}

export interface Scenario {
  id: string
  scenario_key: string
  name: string
  description: string
  is_active: boolean
}

type Step = 'select-leads' | 'select-scenario' | 'review' | 'success'

export default function BulkEmailPage() {
  const [step, setStep] = useState<Step>('select-leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch leads and scenarios on mount
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    // Fetch leads with contacts and emails
    const { data: leadsData } = await supabase
      .from('properties')
      .select(`
        id,
        street_address,
        city,
        price,
        beds,
        baths,
        dom,
        sqft,
        contacts (
          id,
          name,
          emails (
            id,
            email
          )
        )
      `)
      .order('price', { ascending: false })

    // Filter for leads with emails
    const leadsWithEmails = (leadsData || []).filter(p => 
      p.contacts?.some(c => c.emails?.length > 0)
    ) as Lead[]
    
    setLeads(leadsWithEmails)

    // Fetch scenarios
    const { data: scenariosData } = await supabase
      .from('document_scenarios')
      .select('*')
      .eq('is_active', true)
      .eq('content_type', 'email')

    setScenarios(scenariosData || [])
    
    setLoading(false)
  }

  const selectedLeads = leads.filter(l => selectedLeadIds.has(l.id))

  async function handleSend() {
    if (!selectedScenario || selectedLeads.length === 0) return

    setSending(true)

    const payload = {
      batch_id: crypto.randomUUID(),
      user_id: 'suzanna',
      scenario_key: selectedScenario.scenario_key,
      from_name: 'Suzanna Saharyan',
      from_email: 'nadia@norvan.io',
      agent_phone: '310-555-1234',
      leads: selectedLeads.map(lead => {
        const contact = lead.contacts[0]
        const email = contact.emails[0]
        return {
          contact_id: contact.id,
          property_id: lead.id,
          email: email.email,
          name: contact.name,
          property_address: lead.street_address,
          city: lead.city,
          price: lead.price,
          dom: lead.dom,
          beds: lead.beds,
          baths: lead.baths
        }
      })
    }

    try {
      const response = await fetch('https://norflow.app.n8n.cloud/webhook/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setSentCount(selectedLeads.length)
        setStep('success')
      } else {
        throw new Error('Failed to send')
      }
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to queue emails. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleReset() {
    setStep('select-leads')
    setSelectedLeadIds(new Set())
    setSelectedScenario(null)
    setSentCount(0)
  }

  const stepNumber = step === 'select-leads' ? 1 : step === 'select-scenario' ? 2 : step === 'review' ? 3 : 3

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-norv/20 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-norv" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Bulk Email</h1>
            <p className="text-white/50 text-sm">Send personalized AI emails to multiple leads</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/email/history"
            className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
            <span className="text-sm">History</span>
          </Link>
          {step !== 'success' && (
            <div className="text-sm text-white/50">
              Step {stepNumber}/3
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {step !== 'success' && (
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step === 'select-leads' || step === 'select-scenario' || step === 'review' ? 'bg-norv' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'select-scenario' || step === 'review' ? 'bg-norv' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'review' ? 'bg-norv' : 'bg-white/10'}`} />
        </div>
      )}

      {/* Content */}
      <div className="bg-navy-800 border border-white/10 rounded-lg overflow-hidden">
        {step === 'select-leads' && (
          <LeadSelector
            leads={leads}
            selectedIds={selectedLeadIds}
            onSelectionChange={setSelectedLeadIds}
            loading={loading}
            onNext={() => setStep('select-scenario')}
          />
        )}

        {step === 'select-scenario' && (
          <ScenarioSelector
            scenarios={scenarios}
            selectedScenario={selectedScenario}
            onSelect={setSelectedScenario}
            selectedLeadCount={selectedLeadIds.size}
            onBack={() => setStep('select-leads')}
            onNext={() => setStep('review')}
          />
        )}

        {step === 'review' && (
          <SendReview
            leads={selectedLeads}
            scenario={selectedScenario!}
            sending={sending}
            onBack={() => setStep('select-scenario')}
            onSend={handleSend}
          />
        )}

        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Emails Queued Successfully!
            </h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              {sentCount} emails are being generated and sent.
              AI personalizes each email - this takes ~30 seconds total.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/email/history"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                View Sent Emails
              </Link>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Send More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
