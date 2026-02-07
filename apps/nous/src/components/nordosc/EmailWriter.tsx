'use client'

import { useState } from 'react'
import { Send, Sparkles, Copy, Check, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { nordoscLogger } from '@/lib/nordosc-logger'
import GenerationFeedback from './GenerationFeedback'
import type { Lead, Scenario } from '@/types/nordosc'

interface EmailWriterProps {
  lead: Lead
  scenarios: Scenario[]
  agentName?: string
  agentPhone?: string
}

export default function EmailWriter({ lead, scenarios, agentName = 'Agent', agentPhone = '' }: EmailWriterProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(scenarios[0] || null)
  const [generating, setGenerating] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [originalBody, setOriginalBody] = useState('') // Track original for edit comparison
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function generateEmail() {
    if (!selectedScenario) return

    setGenerating(true)
    const startTime = Date.now()

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Prepare variables
      const variables = {
        owner_name: lead.contact_name,
        property_address: lead.property_address,
        city: lead.city,
        price: lead.price,
        dom: lead.dom,
        beds: lead.beds,
        baths: lead.baths,
        agent_name: agentName,
        agent_phone: agentPhone,
      }

      // Call AI generation API
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          scenario: selectedScenario.key,
          variables,
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Generation failed')
      }

      const generationTimeMs = Date.now() - startTime

      // Set content
      setSubject(result.subject)
      setBody(result.body)
      setOriginalBody(result.body) // Store original

      // Log generation
      const genId = await nordoscLogger.logGeneration({
        userId: user.id,
        agentId: result.agentId,
        contentType: 'email',
        scenarioKey: selectedScenario.key,
        scenarioName: selectedScenario.name,
        systemPromptUsed: result.promptUsed,
        variables,
        generatedContent: result.body,
        generatedSubject: result.subject,
        modelUsed: result.model,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        generationTimeMs,
      })

      setGenerationId(genId)
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate email. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSend() {
    if (!body || !generationId) return

    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if content was edited
      const wasEdited = body !== originalBody
      if (wasEdited) {
        await nordoscLogger.logEdit(generationId, originalBody, body)
      }

      // Log the send
      const sendResult = await nordoscLogger.logSend({
        generationId,
        userId: user.id,
        contactId: lead.id,
        propertyId: lead.property_id,
        recipientEmail: lead.email,
        recipientName: lead.contact_name,
        channel: 'email',
        subject,
        body,
      })

      if (!sendResult) {
        throw new Error('Failed to log send')
      }

      // Trigger n8n to actually send the email
      await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendId: sendResult.sendId,
          threadId: sendResult.threadId,
          to: lead.email,
          subject,
          body,
          recipientName: lead.contact_name,
        }),
      })

      setSent(true)
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReset() {
    setSubject('')
    setBody('')
    setOriginalBody('')
    setGenerationId(null)
    setSent(false)
  }

  if (sent) {
    return (
      <div className="bg-navy-800 border border-white/10 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-green-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Email Sent!</h3>
        <p className="text-white/50 mb-4">
          Sent to {lead.contact_name} ({lead.email})
        </p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg mx-auto transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Send Another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-navy-800 border border-white/10 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-medium text-white">Email Writer</h3>
        <p className="text-sm text-white/50">
          To: {lead.contact_name} • {lead.property_address}
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="p-4 border-b border-white/10">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Select Scenario
        </label>
        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.key}
              onClick={() => setSelectedScenario(scenario)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedScenario?.key === scenario.key
                  ? 'bg-norv/20 text-norv border border-norv/50'
                  : 'bg-navy-900 text-white/60 border border-white/10 hover:border-white/20'
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>
        {selectedScenario && (
          <p className="text-xs text-white/40 mt-2">{selectedScenario.description}</p>
        )}
      </div>

      {/* Generate Button */}
      {!body && (
        <div className="p-4">
          <button
            onClick={generateEmail}
            disabled={generating || !selectedScenario}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-norv hover:bg-norv/80 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Email
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Content */}
      {body && (
        <>
          <div className="p-4 space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none resize-none"
              />
              {body !== originalBody && (
                <p className="text-xs text-yellow-400 mt-1">
                  ✏️ You've edited this content
                </p>
              )}
            </div>

            {/* Feedback */}
            {generationId && (
              <div className="pt-2 border-t border-white/10">
                <GenerationFeedback generationId={generationId} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={generateEmail}
                disabled={generating}
                className="flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !body}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
