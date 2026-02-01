'use client'

import Link from 'next/link'
import { ArrowLeft, ScrollText, ToggleRight, ToggleLeft, Save, Plus } from 'lucide-react'
import { useState } from 'react'

export default function NorGuideSetupPage() {
  const [settings, setSettings] = useState({
    script_library: true,
    scenario_bank: true,
    norguide_bot: true,
    search: true,
    favorites: true,
    custom_scripts: true,
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
          <h1 className="text-2xl font-semibold text-white">NorGuide Setup</h1>
          <p className="text-white/60 text-sm">Configure scripts and knowledge base</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <ScrollText className="w-5 h-5 text-norv" />
            <h2 className="text-lg font-medium text-white">NorGuide Features</h2>
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
                    {key === 'script_library' && 'Access to call scripts and templates'}
                    {key === 'scenario_bank' && 'Practice scenarios and roleplay situations'}
                    {key === 'norguide_bot' && 'AI assistant for real-time help'}
                    {key === 'search' && 'Search across scripts and scenarios'}
                    {key === 'favorites' && 'Save favorite scripts for quick access'}
                    {key === 'custom_scripts' && 'Allow agents to create custom scripts'}
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

        {/* NorGuide Bot Settings */}
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">NorGuide Bot Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">AI Model</label>
              <select className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none">
                <option>Claude Sonnet (Recommended)</option>
                <option>Claude Opus</option>
                <option>GPT-4o</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Personality</label>
              <textarea
                rows={3}
                defaultValue="You are a helpful assistant for real estate agents. Be concise, practical, and supportive."
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none resize-none"
              />
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
