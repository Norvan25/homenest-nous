'use client'

import { useState } from 'react'
import { ArrowLeft, Play, Pause, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const scenarios = [
  { id: 'expired', name: 'Expired Listing', description: 'Agent calls expired listing owner' },
  { id: 'fsbo', name: 'FSBO Conversion', description: 'Converting a For Sale By Owner' },
  { id: 'price-reduction', name: 'Price Reduction', description: 'Discussing price adjustment' },
  { id: 'objection-handling', name: 'Objection Handling', description: 'Common seller objections' },
]

const voices = [
  { id: 'professional', name: 'Professional', description: 'Confident and authoritative' },
  { id: 'warm', name: 'Warm & Friendly', description: 'Approachable and empathetic' },
  { id: 'energetic', name: 'Energetic', description: 'High energy, enthusiastic' },
]

export default function AgentLabPage() {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0])
  const [selectedAgentVoice, setSelectedAgentVoice] = useState(voices[0])
  const [selectedHomeownerVoice, setSelectedHomeownerVoice] = useState(voices[1])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([])

  const startSimulation = async () => {
    setIsGenerating(true)
    setTranscript([])
    
    try {
      const response = await fetch('/api/norw/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: selectedScenario.id,
          agent_voice: selectedAgentVoice.id,
          homeowner_voice: selectedHomeownerVoice.id,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setTranscript(data.transcript || [])
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Failed to start simulation:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link
          href="/norw/nortrain"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-2"
        >
          <ArrowLeft size={16} />
          Back to NorTrain
        </Link>
        <h1 className="text-2xl font-semibold">Agent Lab</h1>
        <p className="text-white/60">Watch AI Agent vs AI Homeowner conversations</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Configuration */}
          <div className="col-span-4 space-y-4">
            {/* Scenario Selection */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Select Scenario</h2>
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedScenario.id === scenario.id
                        ? 'border-norw bg-norw/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-sm text-white/50">{scenario.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Voice */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Agent Voice</h2>
              <select
                value={selectedAgentVoice.id}
                onChange={(e) => setSelectedAgentVoice(voices.find(v => v.id === e.target.value) || voices[0])}
                className="w-full bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>

            {/* Homeowner Voice */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-3">Homeowner Voice</h2>
              <select
                value={selectedHomeownerVoice.id}
                onChange={(e) => setSelectedHomeownerVoice(voices.find(v => v.id === e.target.value) || voices[1])}
                className="w-full bg-navy-700 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>

            {/* Start Button */}
            <button
              onClick={startSimulation}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-norw text-white px-4 py-3 rounded-lg font-medium hover:bg-norw/80 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Play size={20} />
              )}
              {isGenerating ? 'Generating...' : 'Start Simulation'}
            </button>
          </div>

          {/* Right: Conversation View */}
          <div className="col-span-8">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-6 min-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">Conversation</h2>
                {transcript.length > 0 && (
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                )}
              </div>

              {transcript.length > 0 ? (
                <div className="space-y-4">
                  {transcript.map((entry, i) => (
                    <div
                      key={i}
                      className={`flex ${entry.role === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                          entry.role === 'agent'
                            ? 'bg-norw text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <div className="text-xs text-white/60 mb-1">
                          {entry.role === 'agent' ? 'Agent' : 'Homeowner'}
                        </div>
                        <div className="text-sm">{entry.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  <div className="text-center">
                    <Play size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Configure settings and start the simulation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
