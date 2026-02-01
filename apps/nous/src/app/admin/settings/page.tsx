'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Key, Bell, Globe, Palette } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api')

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">System Settings</h1>
          <p className="text-white/60 text-sm">Configure platform settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-2 h-fit">
          <button
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'api' ? 'bg-norv/20 text-norv' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'notifications' ? 'bg-norv/20 text-norv' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'general' ? 'bg-norv/20 text-norv' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'appearance' ? 'bg-norv/20 text-norv' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4" />
            Appearance
          </button>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-navy-800/50 border border-white/10 rounded-lg p-6">
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-4">API Keys</h2>
                <p className="text-white/60 text-sm mb-6">
                  Configure your external service API keys. These are stored securely and used for integrations.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Anthropic API Key</label>
                  <input
                    type="password"
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
                  />
                  <p className="text-xs text-white/40 mt-1">Used for NorGuide Bot and NorDOSC generation</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">ElevenLabs API Key</label>
                  <input
                    type="password"
                    placeholder="..."
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
                  />
                  <p className="text-xs text-white/40 mt-1">Used for voice AI agents</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Supabase URL</label>
                  <input
                    type="text"
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Supabase Anon Key</label>
                  <input
                    type="password"
                    placeholder="eyJ..."
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
                  />
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors">
                <Save className="w-4 h-4" />
                Save API Keys
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-4">Notifications</h2>
                <p className="text-white/60 text-sm">Configure notification preferences.</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-navy-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">Email notifications</p>
                    <p className="text-white/50 text-sm">Receive email updates for important events</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20" defaultChecked />
                </label>

                <label className="flex items-center justify-between p-4 bg-navy-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">Error alerts</p>
                    <p className="text-white/50 text-sm">Get notified when errors occur</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20" defaultChecked />
                </label>

                <label className="flex items-center justify-between p-4 bg-navy-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">Call summary reports</p>
                    <p className="text-white/50 text-sm">Daily summary of AI call activities</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20" />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-4">General Settings</h2>
                <p className="text-white/60 text-sm">Configure general platform settings.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Company Name</label>
                  <input
                    type="text"
                    defaultValue="HomeNest"
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Default Timezone</label>
                  <select className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none">
                    <option>America/Los_Angeles (Pacific)</option>
                    <option>America/New_York (Eastern)</option>
                    <option>America/Chicago (Central)</option>
                    <option>America/Denver (Mountain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Date Format</label>
                  <select className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors">
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-4">Appearance</h2>
                <p className="text-white/60 text-sm">Customize the platform appearance.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Theme</label>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-norv/20 text-norv rounded-lg border-2 border-norv">
                      Dark
                    </button>
                    <button className="px-4 py-2 bg-navy-900 text-white/60 rounded-lg border-2 border-transparent hover:border-white/20">
                      Light
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Accent Color</label>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-[#00A6FB] ring-2 ring-offset-2 ring-offset-navy-800 ring-norv" />
                    <button className="w-8 h-8 rounded-full bg-purple-500" />
                    <button className="w-8 h-8 rounded-full bg-green-500" />
                    <button className="w-8 h-8 rounded-full bg-amber-500" />
                    <button className="w-8 h-8 rounded-full bg-pink-500" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
