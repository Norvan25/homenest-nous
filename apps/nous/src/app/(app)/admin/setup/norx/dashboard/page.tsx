'use client'

import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, ToggleRight, ToggleLeft, Save } from 'lucide-react'
import { useState } from 'react'

export default function DashboardSetupPage() {
  const [widgets, setWidgets] = useState([
    { id: 'calls_today', label: 'Calls Today', enabled: true },
    { id: 'appointments', label: 'Appointments', enabled: true },
    { id: 'documents', label: 'Documents Generated', enabled: true },
    { id: 'leads', label: 'Active Leads', enabled: true },
    { id: 'performance', label: 'Performance Chart', enabled: false },
    { id: 'recent_activity', label: 'Recent Activity', enabled: true },
  ])

  function toggleWidget(id: string) {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ))
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard Setup</h1>
          <p className="text-white/60 text-sm">Configure dashboard widgets and layout</p>
        </div>
      </div>

      <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <LayoutDashboard className="w-5 h-5 text-norv" />
          <h2 className="text-lg font-medium text-white">Dashboard Widgets</h2>
        </div>

        <p className="text-white/60 text-sm mb-6">
          Enable or disable widgets that appear on the agent dashboard.
        </p>

        <div className="space-y-3">
          {widgets.map(widget => (
            <div
              key={widget.id}
              className="flex items-center justify-between p-4 bg-navy-900 rounded-lg"
            >
              <span className="text-white">{widget.label}</span>
              <button
                onClick={() => toggleWidget(widget.id)}
                className="text-white/60 hover:text-white"
              >
                {widget.enabled ? (
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
