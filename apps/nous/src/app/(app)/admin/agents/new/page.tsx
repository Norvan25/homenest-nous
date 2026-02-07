'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wand2, Save, Play, ChevronDown, Plus, X, Info, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCurrentView } from '@/hooks/useCurrentView'

interface AgentFormData {
  name: string
  slug: string
  description: string
  type: 'voice' | 'chat' | 'practice'
  category: string
  platform: 'elevenlabs' | 'vapi' | 'openai'
  platform_agent_id: string
  voice_id: string
  model: string
  temperature: number
  max_tokens: number
  persona_role: string
  skills: string
  knowledge_base: string
  constraints: string
  first_message: string
  webhook_url: string
  timeout_seconds: number
  dynamic_variables: string[]
  status: 'draft' | 'active' | 'paused'
}

const defaultFormData: AgentFormData = {
  name: '',
  slug: '',
  description: '',
  type: 'voice',
  category: 'outbound',
  platform: 'elevenlabs',
  platform_agent_id: '',
  voice_id: '',
  model: 'claude-sonnet',
  temperature: 0.7,
  max_tokens: 1000,
  persona_role: '',
  skills: '',
  knowledge_base: '',
  constraints: '',
  first_message: '',
  webhook_url: '',
  timeout_seconds: 300,
  dynamic_variables: ['contact_name', 'property_address', 'agent_name'],
  status: 'draft'
}

export default function NewAgentPage() {
  const router = useRouter()
  const { isSuperAdmin } = useCurrentView()
  
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [newVariable, setNewVariable] = useState('')

  function updateField(field: keyof AgentFormData, value: any) {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug from name
      ...(field === 'name' ? {
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      } : {})
    }))
  }

  function addVariable() {
    if (newVariable && !formData.dynamic_variables.includes(newVariable)) {
      setFormData(prev => ({
        ...prev,
        dynamic_variables: [...prev.dynamic_variables, newVariable]
      }))
      setNewVariable('')
    }
  }

  function removeVariable(variable: string) {
    setFormData(prev => ({
      ...prev,
      dynamic_variables: prev.dynamic_variables.filter(v => v !== variable)
    }))
  }

  function compileSystemPrompt(): string {
    let prompt = ''
    
    if (formData.persona_role) {
      prompt += `# Persona & Role\n${formData.persona_role}\n\n`
    }
    
    if (formData.skills) {
      prompt += `# Skills & Capabilities\n${formData.skills}\n\n`
    }
    
    if (formData.knowledge_base) {
      prompt += `# Knowledge Base\n${formData.knowledge_base}\n\n`
    }
    
    if (formData.constraints) {
      prompt += `# Constraints & Guidelines\n${formData.constraints}\n\n`
    }

    if (formData.dynamic_variables.length > 0) {
      prompt += `# Available Variables\n`
      formData.dynamic_variables.forEach(v => {
        prompt += `- {{${v}}}\n`
      })
    }

    return prompt.trim()
  }

  function generatePrompt() {
    const template = `You are ${formData.name || '[Agent Name]'}, a professional real estate assistant.

Your role is to ${formData.description || 'assist with real estate inquiries'}.

## Guidelines
- Be professional yet warm and personable
- Listen actively and respond to the caller's specific needs
- Provide accurate information about properties
- Offer to schedule appointments when appropriate
- Handle objections gracefully

## Conversation Style
- Use a conversational, natural tone
- Avoid jargon unless the caller uses it
- Confirm understanding before proceeding`

    setFormData(prev => ({
      ...prev,
      persona_role: template
    }))
  }

  async function handleSave(deploy: boolean = false) {
    setSaving(true)

    const agentData = {
      ...formData,
      system_prompt: compileSystemPrompt(),
      status: deploy ? 'active' : formData.status,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    try {
      const { error } = await (supabase.from('ai_agents') as any)
        .insert(agentData)

      if (error) {
        console.error('Error saving agent:', error)
        alert('Error saving agent: ' + error.message)
      } else {
        router.push('/admin/agents')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving agent')
    }

    setSaving(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/agents"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Create Agent</h1>
            <p className="text-white/60 text-sm">Configure your AI agent</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Deploy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Info & Settings */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">1. Basic Info</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Nadia - Outbound Agent"
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="nadia-outbound"
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="What this agent does..."
                  rows={3}
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={generatePrompt}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Generate Agent Prompt
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">2. Settings</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
                  >
                    <option value="voice">🎤 Voice</option>
                    <option value="chat">💬 Chat</option>
                    <option value="practice">🎓 Practice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
                  >
                    <option value="outbound">Outbound</option>
                    <option value="inbound">Inbound</option>
                    <option value="training">Training</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => updateField('platform', e.target.value)}
                  className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
                >
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="vapi">VAPI</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">AI Model</label>
                  <select
                    value={formData.model}
                    onChange={(e) => updateField('model', e.target.value)}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
                  >
                    <option value="claude-sonnet">Claude Sonnet</option>
                    <option value="claude-opus">Claude Opus</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Temperature</label>
                  <input
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                    step="0.1"
                    min="0"
                    max="2"
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
                  />
                </div>
              </div>

              {formData.platform === 'elevenlabs' && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Voice ID</label>
                  <input
                    type="text"
                    value={formData.voice_id}
                    onChange={(e) => updateField('voice_id', e.target.value)}
                    placeholder="ElevenLabs Voice ID"
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Advanced Mode */}
          <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full"
            >
              <h2 className="text-lg font-medium text-white">3. Advanced</h2>
              <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">First Message</label>
                  <textarea
                    value={formData.first_message}
                    onChange={(e) => updateField('first_message', e.target.value)}
                    placeholder="Hi, this is Nadia from HomeNest..."
                    rows={2}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Webhook URL</label>
                  <input
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => updateField('webhook_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Timeout (seconds)</label>
                    <input
                      type="number"
                      value={formData.timeout_seconds}
                      onChange={(e) => updateField('timeout_seconds', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Max Tokens</label>
                    <input
                      type="number"
                      value={formData.max_tokens}
                      onChange={(e) => updateField('max_tokens', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Prompt Components */}
        <div className="space-y-6">
          {/* Agent Prompt — super_admin only */}
          {isSuperAdmin ? (
            <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
              <h2 className="text-lg font-medium text-white mb-4">Agent Prompt</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium text-white/80">Persona & Role</label>
                    <span className="px-1.5 py-0.5 bg-norv/20 text-norv text-xs rounded">Primary</span>
                  </div>
                  <textarea
                    value={formData.persona_role}
                    onChange={(e) => updateField('persona_role', e.target.value)}
                    placeholder="Define who this agent is and their primary role..."
                    rows={6}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none resize-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Skills</label>
                  <textarea
                    value={formData.skills}
                    onChange={(e) => updateField('skills', e.target.value)}
                    placeholder="List the agent's capabilities and skills..."
                    rows={4}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none resize-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Knowledge Base</label>
                  <textarea
                    value={formData.knowledge_base}
                    onChange={(e) => updateField('knowledge_base', e.target.value)}
                    placeholder="Product info, services, FAQs, etc..."
                    rows={4}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none resize-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Constraints</label>
                  <textarea
                    value={formData.constraints}
                    onChange={(e) => updateField('constraints', e.target.value)}
                    placeholder="What the agent should NOT do..."
                    rows={3}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none resize-none font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
              <div className="flex items-center gap-3 text-white/40">
                <Lock className="w-5 h-5" />
                <div>
                  <h3 className="text-white/60 font-medium">Agent Prompt</h3>
                  <p className="text-sm">Prompt editing is restricted to super admins only.</p>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Variables */}
          <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">Dynamic Variables</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.dynamic_variables.map(variable => (
                <span
                  key={variable}
                  className="flex items-center gap-1 px-2 py-1 bg-navy-700 text-norv text-sm rounded"
                >
                  {`{{${variable}}}`}
                  <button
                    onClick={() => removeVariable(variable)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && addVariable()}
                placeholder="new_variable"
                className="flex-1 px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none"
              />
              <button
                onClick={addVariable}
                className="px-3 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
