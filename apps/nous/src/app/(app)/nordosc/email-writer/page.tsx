'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Copy, Save, Send, RefreshCw, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DocumentFeedback } from '@/components/DocumentFeedback'

interface Scenario {
  id: string
  name: string
  description: string
  tags: string[]
}

interface Lead {
  id: string
  contact_name: string
  property_address: string
  status: string
}

const scenarios: Scenario[] = [
  {
    id: 'follow-up-showing',
    name: 'Follow-up After Showing',
    description: 'Send within 24 hours of property showing',
    tags: ['follow-up'],
  },
  {
    id: 'listing-presentation',
    name: 'Listing Presentation Intro',
    description: 'Before first meeting with potential seller',
    tags: ['introduction'],
  },
  {
    id: 'price-reduction',
    name: 'Price Reduction Discussion',
    description: 'Suggest price adjustment to seller',
    tags: ['negotiation'],
  },
  {
    id: 'thank-you-closing',
    name: 'Thank You / Closing',
    description: 'After successful deal completion',
    tags: ['closing'],
  },
]

export default function EmailWriterPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null)
  const [customInstruction, setCustomInstruction] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const { data } = await (supabase.from('crm_leads') as any)
        .select(`
          id,
          status,
          properties (street_address),
          contacts (name)
        `)
        .order('updated_at', { ascending: false })
        .limit(10)
      
      if (data) {
        setLeads(data.map((d: any) => ({
          id: d.id,
          contact_name: d.contacts?.name || 'Unknown',
          property_address: d.properties?.street_address || 'Unknown',
          status: d.status,
        })))
      }
    } catch (error) {
      console.log('Leads not available')
    }
  }

  const generateEmail = async () => {
    if (!selectedScenario) return
    setIsGenerating(true)
    setGeneratedDocId(null)

    try {
      const response = await fetch('/api/nordosc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          scenario_id: selectedScenario.id,
          lead_id: selectedLead?.id,
          custom_instruction: customInstruction,
        }),
      })

      const { content, document_id } = await response.json()
      setGeneratedEmail(content || 'Failed to generate email. Please try again.')
      setGeneratedDocId(document_id || null)
    } catch (error) {
      console.error('Failed to generate email:', error)
      setGeneratedEmail('Error generating email. Check your API configuration.')
    } finally {
      setIsGenerating(false)
    }
  }

  const refineEmail = async (instruction: string) => {
    if (!generatedEmail) return
    setIsGenerating(true)
    setGeneratedDocId(null) // Reset feedback on refine
    try {
      const response = await fetch('/api/nordosc/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedEmail,
          instruction,
        }),
      })

      const { content } = await response.json()
      if (content) setGeneratedEmail(content)
    } catch (error) {
      console.error('Failed to refine email:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail)
    // Show toast notification
  }

  const saveAsTemplate = async () => {
    try {
      await (supabase.from('generated_documents') as any).insert({
        type: 'email',
        scenario: selectedScenario?.id,
        lead_id: selectedLead?.id,
        content: generatedEmail,
      })
      // Show toast notification
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link
          href="/nordosc"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-2"
        >
          <ArrowLeft size={16} />
          Back to NorDOSC
        </Link>
        <h1 className="text-2xl font-semibold">Email Writer</h1>
        <p className="text-white/60">AI-powered email generation with your voice</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Configuration */}
          <div className="col-span-5 space-y-4">
            {/* Scenario Selection */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Select Scenario</h2>
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedScenario?.id === scenario.id
                        ? 'border-norv bg-norv/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-sm text-white/50">{scenario.description}</div>
                    <div className="flex gap-1 mt-2">
                      {scenario.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-white/10 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lead Selection */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Context (Optional)</h2>
              <select
                value={selectedLead?.id || ''}
                onChange={(e) => {
                  const lead = leads.find(l => l.id === e.target.value)
                  setSelectedLead(lead || null)
                }}
                className="w-full bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">No specific lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.contact_name} - {lead.property_address}
                  </option>
                ))}
              </select>

              {selectedLead && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg text-sm">
                  <div><strong>Lead:</strong> {selectedLead.contact_name}</div>
                  <div><strong>Property:</strong> {selectedLead.property_address}</div>
                  <div><strong>Status:</strong> {selectedLead.status}</div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateEmail}
              disabled={!selectedScenario || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-norv text-white px-4 py-3 rounded-lg font-medium hover:bg-norv/80 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              Generate Email
            </button>
          </div>

          {/* Right: Generated Content */}
          <div className="col-span-7 space-y-4">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Generated Email</h2>
              
              {generatedEmail ? (
                <>
                  <div className="bg-navy-900 rounded-lg p-4 min-h-[300px] whitespace-pre-wrap text-sm">
                    {generatedEmail}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                      >
                        <Copy size={16} />
                        Copy
                      </button>
                      <button
                        onClick={saveAsTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-norv text-white rounded-lg hover:bg-norv/80">
                        <Send size={16} />
                        Send
                      </button>
                    </div>
                    
                    {generatedDocId && (
                      <DocumentFeedback documentId={generatedDocId} />
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-navy-900 rounded-lg p-4 min-h-[300px] flex items-center justify-center text-white/40">
                  Select a scenario and click Generate
                </div>
              )}
            </div>

            {/* Refine Options */}
            {generatedEmail && (
              <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
                <h3 className="font-medium mb-3">Refine</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Make it warmer', 'Add urgency', 'Shorter version', 'More professional'].map((option) => (
                    <button
                      key={option}
                      onClick={() => refineEmail(option)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="Custom instruction..."
                    className="flex-1 bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => refineEmail(customInstruction)}
                    disabled={!customInstruction || isGenerating}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
