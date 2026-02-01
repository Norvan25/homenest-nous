'use client'

import Link from 'next/link'
import { ArrowLeft, GraduationCap, ToggleRight, ToggleLeft, Save } from 'lucide-react'
import { useState } from 'react'

export default function NorTrainSetupPage() {
  const [settings, setSettings] = useState({
    practice_room: true,
    agent_lab: true,
    scoring: true,
    feedback: true,
    recordings: true,
    leaderboard: false,
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
          <h1 className="text-2xl font-semibold text-white">NorTrain Setup</h1>
          <p className="text-white/60 text-sm">Configure training and practice features</p>
        </div>
      </div>

      <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-5 h-5 text-norv" />
          <h2 className="text-lg font-medium text-white">Training Features</h2>
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
                  {key === 'practice_room' && 'Enable practice calls with AI personas'}
                  {key === 'agent_lab' && 'Allow testing AI agents before deployment'}
                  {key === 'scoring' && 'Score practice sessions automatically'}
                  {key === 'feedback' && 'Provide AI feedback on performance'}
                  {key === 'recordings' && 'Record practice sessions for review'}
                  {key === 'leaderboard' && 'Show team leaderboard for gamification'}
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
