'use client'

import Link from 'next/link'
import { ArrowLeft, PhoneIncoming, ToggleRight, ToggleLeft, Save } from 'lucide-react'
import { useState } from 'react'

export default function NorCoachSetupPage() {
  const [settings, setSettings] = useState({
    call_analyzer: true,
    prompt_evolution: true,
    auto_analysis: true,
    sentiment_detection: true,
    coaching_tips: true,
    benchmarks: false,
  })

  function toggleSetting(key: string) {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">NorCoach Setup</h1>
          <p className="text-white/60 text-sm">Configure coaching and analysis features</p>
        </div>
      </div>

      <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <PhoneIncoming className="w-5 h-5 text-norv" />
          <h2 className="text-lg font-medium text-white">Coaching Features</h2>
        </div>

        <div className="space-y-3">
          {Object.entries(settings).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-navy-900 rounded-lg"
            >
              <div>
                <span className="text-white capitalize">{key.replace(/_/g, ' ')}</span>
                <p className="text-sm text-white/40">
                  {key === 'call_analyzer' && 'Analyze call recordings for insights'}
                  {key === 'prompt_evolution' && 'Track and improve AI prompts over time'}
                  {key === 'auto_analysis' && 'Automatically analyze new calls'}
                  {key === 'sentiment_detection' && 'Detect caller sentiment during calls'}
                  {key === 'coaching_tips' && 'Provide coaching recommendations'}
                  {key === 'benchmarks' && 'Compare performance against benchmarks'}
                </p>
              </div>
              <button
                onClick={() => toggleSetting(key)}
                className="text-white/60 hover:text-white"
              >
                {value ? (
                  <ToggleRight className="w-8 h-8 text-green-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>
          ))}
        </div>

        <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors">
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
      </div>
    </div>
  )
}
