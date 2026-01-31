'use client'

import { useState } from 'react'
import { ArrowLeft, Copy, Save, Download, RefreshCw, Sparkles } from 'lucide-react'
import Link from 'next/link'

const letterTypes = [
  { id: 'introduction', name: 'Introduction Letter', description: 'Introduce yourself to potential clients' },
  { id: 'listing-proposal', name: 'Listing Proposal', description: 'Formal proposal to list a property' },
  { id: 'offer-letter', name: 'Offer Letter', description: 'Buyer offer communication' },
  { id: 'thank-you', name: 'Thank You Letter', description: 'Post-closing appreciation' },
  { id: 'market-update', name: 'Market Update', description: 'Inform clients about market changes' },
]

export default function LetterWriterPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [generatedLetter, setGeneratedLetter] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [propertyAddress, setPropertyAddress] = useState('')

  const generateLetter = async () => {
    if (!selectedType) return
    setIsGenerating(true)

    try {
      const response = await fetch('/api/nordosc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'letter',
          scenario_id: selectedType,
          context: { recipientName, propertyAddress },
        }),
      })

      const { content } = await response.json()
      setGeneratedLetter(content || 'Failed to generate letter.')
    } catch (error) {
      console.error('Failed to generate letter:', error)
      setGeneratedLetter('Error generating letter. Check your API configuration.')
    } finally {
      setIsGenerating(false)
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
        <h1 className="text-2xl font-semibold">Letter Writer</h1>
        <p className="text-white/60">Professional letters for every occasion</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Configuration */}
          <div className="col-span-5 space-y-4">
            {/* Letter Type Selection */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Letter Type</h2>
              <div className="space-y-2">
                {letterTypes.map((type) => (
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
                    <div className="text-sm text-white/50">{type.description}</div>
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
                    placeholder="John & Jane Smith"
                    className="w-full bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 block mb-1">Property Address</label>
                  <input
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="123 Main St, City"
                    className="w-full bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateLetter}
              disabled={!selectedType || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-norv text-white px-4 py-3 rounded-lg font-medium hover:bg-norv/80 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              Generate Letter
            </button>
          </div>

          {/* Right: Generated Content */}
          <div className="col-span-7">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Generated Letter</h2>
              
              {generatedLetter ? (
                <>
                  <div className="bg-white rounded-lg p-6 min-h-[400px] text-navy-900 whitespace-pre-wrap text-sm font-serif">
                    {generatedLetter}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedLetter)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                      <Save size={16} />
                      Save
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-norv text-white rounded-lg hover:bg-norv/80">
                      <Download size={16} />
                      Download PDF
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-white/5 rounded-lg p-4 min-h-[400px] flex items-center justify-center text-white/40">
                  Select a letter type and click Generate
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
