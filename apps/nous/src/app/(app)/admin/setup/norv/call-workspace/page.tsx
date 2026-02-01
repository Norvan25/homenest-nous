'use client'

import Link from 'next/link'
import { ArrowLeft, Phone, ToggleRight, ToggleLeft, Save } from 'lucide-react'
import { useState } from 'react'

export default function CallWorkspaceSetupPage() {
  const [settings, setSettings] = useState({
    auto_dial: true,
    recording: true,
    transcription: true,
    call_disposition: true,
    callback_scheduling: true,
    crm_integration: true,
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
          <h1 className="text-2xl font-semibold text-white">Call Workspace Setup</h1>
          <p className="text-white/60 text-sm">Configure calling features and integrations</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Features */}
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Phone className="w-5 h-5 text-norv" />
            <h2 className="text-lg font-medium text-white">Features</h2>
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
                    {key === 'auto_dial' && 'Automatically dial next number in queue'}
                    {key === 'recording' && 'Record all calls for quality review'}
                    {key === 'transcription' && 'Transcribe calls in real-time'}
                    {key === 'call_disposition' && 'Track call outcomes and dispositions'}
                    {key === 'callback_scheduling' && 'Schedule callbacks from call workspace'}
                    {key === 'crm_integration' && 'Sync call data with NorCRM'}
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
        </div>

        {/* Voice Provider */}
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">Voice Provider</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Provider</label>
              <select className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none">
                <option>ElevenLabs</option>
                <option>VAPI</option>
                <option>Twilio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Default AI Agent</label>
              <select className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none">
                <option>Nadia - Outbound Caller</option>
                <option>Practice Skeptic</option>
              </select>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors">
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
      </div>
    </div>
  )
}
