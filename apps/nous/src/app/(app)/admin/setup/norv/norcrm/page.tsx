'use client'

import Link from 'next/link'
import { ArrowLeft, Users, ToggleRight, ToggleLeft, Save, Plus, X } from 'lucide-react'
import { useState } from 'react'

export default function NorCRMSetupPage() {
  const [leadStatuses, setLeadStatuses] = useState([
    { id: 'new', label: 'New', color: '#3B82F6' },
    { id: 'contacted', label: 'Contacted', color: '#F59E0B' },
    { id: 'qualified', label: 'Qualified', color: '#10B981' },
    { id: 'nurturing', label: 'Nurturing', color: '#8B5CF6' },
    { id: 'lost', label: 'Lost', color: '#EF4444' },
  ])

  const [settings, setSettings] = useState({
    auto_assign: true,
    duplicate_check: true,
    activity_tracking: true,
    email_integration: false,
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
          <h1 className="text-2xl font-semibold text-white">NorCRM Setup</h1>
          <p className="text-white/60 text-sm">Configure CRM settings and lead management</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Features */}
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-norv" />
            <h2 className="text-lg font-medium text-white">CRM Features</h2>
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
                    {key === 'auto_assign' && 'Automatically assign leads to agents'}
                    {key === 'duplicate_check' && 'Check for duplicate leads on import'}
                    {key === 'activity_tracking' && 'Track all lead activities and touches'}
                    {key === 'email_integration' && 'Sync emails with lead records'}
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

        {/* Lead Statuses */}
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white">Lead Statuses</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-norv/20 hover:bg-norv/30 text-norv rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" />
              Add Status
            </button>
          </div>

          <div className="space-y-2">
            {leadStatuses.map(status => (
              <div
                key={status.id}
                className="flex items-center justify-between p-3 bg-navy-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-white">{status.label}</span>
                </div>
                <button className="p-1 hover:bg-white/5 rounded">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
            ))}
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
