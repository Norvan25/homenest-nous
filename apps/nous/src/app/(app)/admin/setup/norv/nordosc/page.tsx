'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, FileText, MessageSquare, Save, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Scenario {
  id: string
  type: string
  name: string
  description: string
  prompt_template: string
  is_active: boolean
}

interface ToolConfig {
  tool_key: string
  tool_name: string
  default_enabled: boolean
  ai_model: string
  ai_temperature: number
}

export default function NorDOSCSetupPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [configs, setConfigs] = useState<ToolConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'email' | 'letter' | 'sms'>('email')
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    try {
      // Load scenarios
      const { data: scenarioData } = await (supabase.from('document_scenarios') as any)
        .select('*')
        .order('type', { ascending: true })

      if (scenarioData) {
        setScenarios(scenarioData)
      } else {
        // Mock data for demo
        setScenarios([
          { id: 'cold-intro', type: 'email', name: 'Cold Introduction', description: 'Initial outreach to expired listing', prompt_template: 'Write a professional cold email...', is_active: true },
          { id: 'follow-up', type: 'email', name: 'Follow-Up', description: 'Follow up after no response', prompt_template: 'Write a friendly follow-up...', is_active: true },
          { id: 'formal-letter', type: 'letter', name: 'Formal Letter', description: 'Professional formal letter', prompt_template: 'Write a formal letter...', is_active: true },
          { id: 'appointment-confirm', type: 'sms', name: 'Appointment Confirmation', description: 'Confirm scheduled appointment', prompt_template: 'Write a brief SMS...', is_active: true },
        ])
      }

      // Load tool configurations
      const { data: configData } = await (supabase.from('tool_configurations') as any)
        .select('*')
        .like('tool_key', 'nordosc.%')

      if (configData) {
        setConfigs(configData)
      } else {
        // Mock data for demo
        setConfigs([
          { tool_key: 'nordosc.email_writer', tool_name: 'Email Writer', default_enabled: true, ai_model: 'claude-sonnet', ai_temperature: 0.7 },
          { tool_key: 'nordosc.letter_writer', tool_name: 'Letter Writer', default_enabled: true, ai_model: 'claude-sonnet', ai_temperature: 0.7 },
          { tool_key: 'nordosc.sms_writer', tool_name: 'SMS Writer', default_enabled: true, ai_model: 'claude-sonnet', ai_temperature: 0.5 },
        ])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
    
    setLoading(false)
  }

  async function toggleToolEnabled(toolKey: string, enabled: boolean) {
    try {
      await (supabase.from('tool_configurations') as any)
        .update({ default_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('tool_key', toolKey)

      // Update local state
      setConfigs(prev => prev.map(c => 
        c.tool_key === toolKey ? { ...c, default_enabled: enabled } : c
      ))
    } catch (error) {
      console.error('Error toggling tool:', error)
    }
  }

  async function toggleScenarioActive(id: string, isActive: boolean) {
    try {
      await (supabase.from('document_scenarios') as any)
        .update({ is_active: isActive })
        .eq('id', id)

      setScenarios(prev => prev.map(s =>
        s.id === id ? { ...s, is_active: isActive } : s
      ))
    } catch (error) {
      console.error('Error toggling scenario:', error)
    }
  }

  async function deleteScenario(id: string) {
    if (!confirm('Are you sure you want to delete this scenario?')) return

    try {
      await (supabase.from('document_scenarios') as any)
        .delete()
        .eq('id', id)

      setScenarios(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error deleting scenario:', error)
    }
  }

  async function saveScenario(scenario: Partial<Scenario>) {
    try {
      if (scenario.id && scenarios.find(s => s.id === scenario.id)) {
        // Update existing
        await (supabase.from('document_scenarios') as any)
          .update(scenario)
          .eq('id', scenario.id)
        
        setScenarios(prev => prev.map(s => 
          s.id === scenario.id ? { ...s, ...scenario } as Scenario : s
        ))
      } else {
        // Insert new
        const newScenario = {
          ...scenario,
          id: scenario.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type: activeTab
        }
        await (supabase.from('document_scenarios') as any)
          .insert(newScenario)
        
        setScenarios(prev => [...prev, newScenario as Scenario])
      }
    } catch (error) {
      console.error('Error saving scenario:', error)
    }

    setEditingScenario(null)
  }

  const toolIcons: Record<string, any> = {
    'nordosc.email_writer': Mail,
    'nordosc.letter_writer': FileText,
    'nordosc.sms_writer': MessageSquare
  }

  const tabScenarios = scenarios.filter(s => s.type === activeTab)

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">NorDOSC Setup</h1>
          <p className="text-white/60 text-sm">Configure document generation tools</p>
        </div>
      </div>

      {/* Tool Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {configs.map(config => {
          const Icon = toolIcons[config.tool_key] || Mail
          return (
            <div
              key={config.tool_key}
              className="bg-navy-800/50 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-norv" />
                  <span className="font-medium text-white">{config.tool_name}</span>
                </div>
                <button
                  onClick={() => toggleToolEnabled(config.tool_key, !config.default_enabled)}
                  className="text-white/60 hover:text-white"
                >
                  {config.default_enabled ? (
                    <ToggleRight className="w-8 h-8 text-norv" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
              <p className="text-sm text-white/50">
                {config.default_enabled ? 'Enabled for all users' : 'Disabled'}
              </p>
            </div>
          )
        })}
      </div>

      {/* Scenarios Management */}
      <div className="bg-navy-800/50 border border-white/10 rounded-lg">
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['email', 'letter', 'sms'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-norv border-b-2 border-norv'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Scenarios
            </button>
          ))}
        </div>

        {/* Scenario List */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Scenarios
            </h3>
            <button
              onClick={() => setEditingScenario({ id: '', type: activeTab, name: '', description: '', prompt_template: '', is_active: true })}
              className="flex items-center gap-2 px-3 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Scenario
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-white/50">Loading...</div>
          ) : tabScenarios.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              No scenarios found. Create one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {tabScenarios.map(scenario => (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between p-4 bg-navy-900 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleScenarioActive(scenario.id, !scenario.is_active)}
                      className="text-white/60 hover:text-white"
                    >
                      {scenario.is_active ? (
                        <ToggleRight className="w-6 h-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                    <div>
                      <h4 className="font-medium text-white">{scenario.name}</h4>
                      <p className="text-sm text-white/50">{scenario.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingScenario(scenario)}
                      className="p-2 hover:bg-white/5 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4 text-white/50" />
                    </button>
                    <button
                      onClick={() => deleteScenario(scenario.id)}
                      className="p-2 hover:bg-white/5 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingScenario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-white/10 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-medium text-white">
                {editingScenario.id ? 'Edit Scenario' : 'New Scenario'}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
                <input
                  type="text"
                  value={editingScenario.name}
                  onChange={(e) => setEditingScenario({ ...editingScenario, name: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
                <input
                  type="text"
                  value={editingScenario.description}
                  onChange={(e) => setEditingScenario({ ...editingScenario, description: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Prompt Template</label>
                <textarea
                  value={editingScenario.prompt_template}
                  onChange={(e) => setEditingScenario({ ...editingScenario, prompt_template: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white font-mono text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setEditingScenario(null)}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveScenario(editingScenario)}
                className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
