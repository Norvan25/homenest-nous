'use client'

import { useState } from 'react'
import { ArrowLeft, Copy, Send, RefreshCw, Sparkles, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const smsTypes = [
  { id: 'appointment-reminder', name: 'Appointment Reminder', example: 'Hi [Name], just confirming our meeting tomorrow at...' },
  { id: 'showing-followup', name: 'Showing Follow-up', example: 'Hi [Name], thanks for viewing the property today...' },
  { id: 'new-listing', name: 'New Listing Alert', example: 'Hi [Name], a new property just hit the market...' },
  { id: 'price-update', name: 'Price Update', example: 'Hi [Name], great news - the price on [Address] was reduced...' },
  { id: 'quick-checkin', name: 'Quick Check-in', example: 'Hi [Name], just checking in on your home search...' },
]

export default function SMSWriterPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [generatedSMS, setGeneratedSMS] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [customContext, setCustomContext] = useState('')

  const generateSMS = async () => {
    if (!selectedType) return
    setIsGenerating(true)

    try {
      const response = await fetch('/api/nordosc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sms',
          scenario_id: selectedType,
          context: { recipientName, customContext },
        }),
      })

      const { content } = await response.json()
      setGeneratedSMS(content || 'Failed to generate SMS.')
    } catch (error) {
      console.error('Failed to generate SMS:', error)
      setGeneratedSMS('Error generating SMS. Check your API configuration.')
    } finally {
      setIsGenerating(false)
    }
  }

  const characterCount = generatedSMS.length
  const isOverLimit = characterCount > 160

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
        <h1 className="text-2xl font-semibold">SMS Writer</h1>
        <p className="text-white/60">Quick, effective text messages</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Configuration */}
          <div className="col-span-5 space-y-4">
            {/* SMS Type Selection */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Message Type</h2>
              <div className="space-y-2">
                {smsTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedType === type.id
                        ? 'border-norv bg-norv/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-white/40 mt-1 truncate">{type.example}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Context Inputs */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/60 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 block mb-1">Additional Context</label>
                  <textarea
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="Any specific details to include..."
                    rows={3}
                    className="w-full bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateSMS}
              disabled={!selectedType || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-norv text-white px-4 py-3 rounded-lg font-medium hover:bg-norv/80 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              Generate SMS
            </button>
          </div>

          {/* Right: Generated Content */}
          <div className="col-span-7">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Generated SMS</h2>
                {generatedSMS && (
                  <span className={`text-sm ${isOverLimit ? 'text-red-400' : 'text-white/40'}`}>
                    {characterCount}/160 characters
                  </span>
                )}
              </div>
              
              {/* Phone Preview */}
              <div className="flex justify-center">
                <div className="w-80 bg-navy-900 rounded-3xl p-4 border-4 border-navy-700">
                  <div className="bg-navy-800 rounded-2xl p-4 min-h-[200px]">
                    {generatedSMS ? (
                      <div className="space-y-2">
                        <div className="bg-norv text-white p-3 rounded-2xl rounded-br-sm text-sm max-w-[85%] ml-auto">
                          {generatedSMS}
                        </div>
                        {isOverLimit && (
                          <div className="text-xs text-red-400 text-center">
                            Message exceeds 160 characters
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/30">
                        <div className="text-center">
                          <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Your message preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {generatedSMS && (
                <div className="flex gap-2 mt-4 justify-center">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedSMS)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-norv text-white rounded-lg hover:bg-norv/80">
                    <Send size={16} />
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
