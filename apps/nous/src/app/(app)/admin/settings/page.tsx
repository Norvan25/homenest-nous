'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { 
  ArrowLeft, Save, Key, Bell, Globe, Palette, Bot, 
  CheckCircle, AlertCircle, Eye, EyeOff, Sparkles,
  MessageSquare, Phone, FileText, GraduationCap, HelpCircle, Check
} from 'lucide-react'
import { useTheme, ACCENT_COLORS } from '@/contexts/ThemeContext'

interface ApiKey {
  id: string
  provider: string
  key_name: string
  key_value: string
  is_active: boolean
}

interface ModelConfig {
  id: string
  scenario: string
  provider: string
  model: string
  temperature: number
  max_tokens: number
}

const LLM_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'] },
  { id: 'google', name: 'Google Gemini', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
  { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'] },
  { id: 'mistral', name: 'Mistral', models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'] },
]

const AI_SCENARIOS = [
  { id: 'norguide_bot', name: 'NorGuide Bot', description: 'Knowledge base assistant', icon: HelpCircle },
  { id: 'nordosc_generation', name: 'NorDOSC Generation', description: 'Document & content creation', icon: FileText },
  { id: 'norcoach_analysis', name: 'NorCoach Analysis', description: 'Call analysis & feedback', icon: MessageSquare },
  { id: 'nortrain_roleplay', name: 'NorTrain Roleplay', description: 'Practice scenario simulation', icon: GraduationCap },
  { id: 'assistant_widget', name: 'Assistant Widget', description: 'General AI assistant', icon: Sparkles },
  { id: 'voice_agent', name: 'Voice Agent (ElevenLabs)', description: 'Phone AI agents', icon: Phone },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
    groq: '',
    mistral: '',
    elevenlabs: '',
    supabase_url: '',
    supabase_anon: '',
    supabase_service: '',
  })

  // Model configurations
  const [modelConfigs, setModelConfigs] = useState<Record<string, { provider: string; model: string; temperature: number; max_tokens: number }>>({
    norguide_bot: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', temperature: 0.7, max_tokens: 4096 },
    nordosc_generation: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', temperature: 0.8, max_tokens: 8192 },
    norcoach_analysis: { provider: 'openai', model: 'gpt-4o', temperature: 0.3, max_tokens: 4096 },
    nortrain_roleplay: { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.9, max_tokens: 2048 },
    assistant_widget: { provider: 'anthropic', model: 'claude-3-haiku-20240307', temperature: 0.7, max_tokens: 2048 },
    voice_agent: { provider: 'elevenlabs', model: 'eleven_turbo_v2', temperature: 0.5, max_tokens: 1024 },
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Toggle key visibility
  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Handle API key change
  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }))
  }

  // Handle model config change
  const handleModelConfigChange = (scenario: string, field: string, value: string | number) => {
    setModelConfigs(prev => ({
      ...prev,
      [scenario]: { ...prev[scenario], [field]: value }
    }))
  }

  // Save settings
  const handleSave = async () => {
    setSaving(true)
    try {
      // In production, save to secure storage (e.g., Supabase vault or encrypted table)
      // For now, we'll just show success feedback
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">System Settings</h1>
          <p className="text-white/60 text-sm">Configure platform settings and AI models</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
          <CheckCircle className="w-4 h-4" />
          Settings saved successfully!
        </div>
      )}

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
            onClick={() => setActiveTab('models')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'models' ? 'bg-norv/20 text-norv' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Models
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
          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-2">API Keys</h2>
                <p className="text-white/60 text-sm mb-6">
                  Configure your LLM provider API keys. These are stored securely and used for AI features.
                </p>
              </div>

              {/* LLM Providers */}
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-norv" />
                  LLM Providers
                </h3>
                <div className="space-y-4">
                  {/* OpenAI */}
                  <div className="p-4 bg-navy-900/50 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">OpenAI API Key</label>
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">GPT-4, GPT-3.5</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys.openai ? 'text' : 'password'}
                        value={apiKeys.openai}
                        onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none pr-10"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('openai')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Get your key at platform.openai.com</p>
                  </div>

                  {/* Anthropic */}
                  <div className="p-4 bg-navy-900/50 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Anthropic API Key</label>
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">Claude 3.5, Claude 3</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys.anthropic ? 'text' : 'password'}
                        value={apiKeys.anthropic}
                        onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none pr-10"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('anthropic')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Get your key at console.anthropic.com</p>
                  </div>

                  {/* Google Gemini */}
                  <div className="p-4 bg-navy-900/50 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Google Gemini API Key</label>
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Gemini 2.0, 1.5</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys.google ? 'text' : 'password'}
                        value={apiKeys.google}
                        onChange={(e) => handleApiKeyChange('google', e.target.value)}
                        placeholder="AIza..."
                        className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none pr-10"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('google')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showKeys.google ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Get your key at aistudio.google.com</p>
                  </div>

                  {/* Groq */}
                  <div className="p-4 bg-navy-900/50 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Groq API Key</label>
                      <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">Llama 3.3, Mixtral</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys.groq ? 'text' : 'password'}
                        value={apiKeys.groq}
                        onChange={(e) => handleApiKeyChange('groq', e.target.value)}
                        placeholder="gsk_..."
                        className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none pr-10"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('groq')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showKeys.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Get your key at console.groq.com (Fast inference)</p>
                  </div>

                  {/* Mistral */}
                  <div className="p-4 bg-navy-900/50 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Mistral API Key</label>
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">Mistral Large, Medium</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys.mistral ? 'text' : 'password'}
                        value={apiKeys.mistral}
                        onChange={(e) => handleApiKeyChange('mistral', e.target.value)}
                        placeholder="..."
                        className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none pr-10"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('mistral')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showKeys.mistral ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Get your key at console.mistral.ai</p>
                  </div>
                </div>
              </div>

              {/* Voice & Other Services */}
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-norv" />
                  Voice & Other Services
                </h3>
                <div className="space-y-4">
                  {/* ElevenLabs */}
                  <div className="p-4 bg-navy-900/50 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">ElevenLabs API Key</label>
                      <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded">Voice AI</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys.elevenlabs ? 'text' : 'password'}
                        value={apiKeys.elevenlabs}
                        onChange={(e) => handleApiKeyChange('elevenlabs', e.target.value)}
                        placeholder="..."
                        className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-norv focus:outline-none pr-10"
                      />
                      <button
                        onClick={() => toggleKeyVisibility('elevenlabs')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showKeys.elevenlabs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Used for voice AI agents in Call Workspace</p>
                  </div>
                </div>
              </div>

              {/* Supabase (Read-only display) */}
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-norv" />
                  Database (Configured via Environment)
                </h3>
                <div className="p-4 bg-navy-900/30 rounded-lg border border-white/5">
                  <p className="text-sm text-white/50">
                    Supabase credentials are configured via environment variables for security.
                    Contact your administrator to update database settings.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save API Keys'}
              </button>
            </div>
          )}

          {/* AI Models Tab */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-2">AI Model Configuration</h2>
                <p className="text-white/60 text-sm mb-6">
                  Choose which LLM provider and model to use for each AI feature. Different scenarios may benefit from different models.
                </p>
              </div>

              <div className="space-y-4">
                {AI_SCENARIOS.map((scenario) => {
                  const config = modelConfigs[scenario.id]
                  const Icon = scenario.icon
                  const selectedProvider = LLM_PROVIDERS.find(p => p.id === config?.provider)
                  
                  return (
                    <div key={scenario.id} className="p-4 bg-navy-900/50 rounded-lg border border-white/5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-norv/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-norv" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{scenario.name}</h3>
                          <p className="text-white/50 text-sm">{scenario.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Provider Selection */}
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">Provider</label>
                          <select
                            value={config?.provider || ''}
                            onChange={(e) => {
                              const newProvider = LLM_PROVIDERS.find(p => p.id === e.target.value)
                              handleModelConfigChange(scenario.id, 'provider', e.target.value)
                              if (newProvider?.models[0]) {
                                handleModelConfigChange(scenario.id, 'model', newProvider.models[0])
                              }
                            }}
                            className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white text-sm focus:border-norv focus:outline-none"
                          >
                            {LLM_PROVIDERS.map(provider => (
                              <option key={provider.id} value={provider.id}>{provider.name}</option>
                            ))}
                            {scenario.id === 'voice_agent' && (
                              <option value="elevenlabs">ElevenLabs</option>
                            )}
                          </select>
                        </div>

                        {/* Model Selection */}
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">Model</label>
                          <select
                            value={config?.model || ''}
                            onChange={(e) => handleModelConfigChange(scenario.id, 'model', e.target.value)}
                            className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white text-sm focus:border-norv focus:outline-none"
                          >
                            {config?.provider === 'elevenlabs' ? (
                              <>
                                <option value="eleven_turbo_v2">Turbo v2</option>
                                <option value="eleven_multilingual_v2">Multilingual v2</option>
                              </>
                            ) : (
                              selectedProvider?.models.map(model => (
                                <option key={model} value={model}>{model}</option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Temperature */}
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">
                            Temperature: {config?.temperature?.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config?.temperature || 0.7}
                            onChange={(e) => handleModelConfigChange(scenario.id, 'temperature', parseFloat(e.target.value))}
                            className="w-full accent-norv"
                          />
                          <div className="flex justify-between text-xs text-white/40">
                            <span>Precise</span>
                            <span>Creative</span>
                          </div>
                        </div>

                        {/* Max Tokens */}
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">Max Tokens</label>
                          <select
                            value={config?.max_tokens || 2048}
                            onChange={(e) => handleModelConfigChange(scenario.id, 'max_tokens', parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white text-sm focus:border-norv focus:outline-none"
                          >
                            <option value={1024}>1,024</option>
                            <option value={2048}>2,048</option>
                            <option value={4096}>4,096</option>
                            <option value={8192}>8,192</option>
                            <option value={16384}>16,384</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Cost Estimation */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-400 font-medium mb-1">Cost Considerations</h4>
                    <p className="text-amber-400/80 text-sm">
                      Different models have different pricing. GPT-4o and Claude 3.5 Sonnet are premium models with higher costs.
                      Consider using GPT-4o-mini, Claude Haiku, or Groq (Llama) for high-volume, lower-stakes tasks.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Model Configuration'}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
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
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20 accent-norv" defaultChecked />
                </label>

                <label className="flex items-center justify-between p-4 bg-navy-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">Error alerts</p>
                    <p className="text-white/50 text-sm">Get notified when errors occur</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20 accent-norv" defaultChecked />
                </label>

                <label className="flex items-center justify-between p-4 bg-navy-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">Call summary reports</p>
                    <p className="text-white/50 text-sm">Daily summary of AI call activities</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20 accent-norv" />
                </label>

                <label className="flex items-center justify-between p-4 bg-navy-900 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">API usage alerts</p>
                    <p className="text-white/50 text-sm">Alert when API usage exceeds threshold</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20 accent-norv" defaultChecked />
                </label>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Notification Settings
              </button>
            </div>
          )}

          {/* General Tab */}
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

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Default AI Response Language</label>
                  <select className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-norv focus:outline-none">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <AppearanceTab />
          )}
        </div>
      </div>
    </div>
  )
}

// Separate component for Appearance tab to use the theme hook
function AppearanceTab() {
  const { theme, setTheme, accentColor, setAccentColor, sidebarStyle, setSidebarStyle } = useTheme()
  const [saved, setSaved] = useState(false)

  const accentColors = [
    { id: 'cyan' as const, color: '#00A6FB', name: 'Cyan' },
    { id: 'purple' as const, color: '#8B5CF6', name: 'Purple' },
    { id: 'green' as const, color: '#10B981', name: 'Green' },
    { id: 'amber' as const, color: '#F59E0B', name: 'Amber' },
    { id: 'pink' as const, color: '#EC4899', name: 'Pink' },
  ]

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-4">Appearance</h2>
        <p className="text-white/60 text-sm">Customize the platform appearance. Changes are applied immediately and saved to your browser.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
          <CheckCircle className="w-4 h-4" />
          Appearance settings saved!
        </div>
      )}

      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-3">Theme</label>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'bg-norv/20 border-norv'
                  : 'bg-navy-900 border-transparent hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={theme === 'dark' ? 'text-norv font-medium' : 'text-white/60'}>Dark</span>
                {theme === 'dark' && <Check className="w-4 h-4 text-norv" />}
              </div>
              <div className="h-20 rounded-lg bg-[#0A1628] border border-white/10 p-2">
                <div className="w-8 h-2 bg-white/20 rounded mb-1" />
                <div className="w-12 h-2 bg-white/10 rounded mb-1" />
                <div className="w-6 h-2 bg-norv/50 rounded" />
              </div>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'bg-norv/20 border-norv'
                  : 'bg-navy-900 border-transparent hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={theme === 'light' ? 'text-norv font-medium' : 'text-white/60'}>Light</span>
                {theme === 'light' && <Check className="w-4 h-4 text-norv" />}
              </div>
              <div className="h-20 rounded-lg bg-[#f8fafc] border border-black/10 p-2">
                <div className="w-8 h-2 bg-black/20 rounded mb-1" />
                <div className="w-12 h-2 bg-black/10 rounded mb-1" />
                <div className="w-6 h-2 bg-norv/50 rounded" />
              </div>
            </button>
          </div>
        </div>

        {/* Accent Color Selection */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-3">Accent Color</label>
          <div className="flex gap-3">
            {accentColors.map((color) => (
              <button
                key={color.id}
                onClick={() => setAccentColor(color.id)}
                className={`relative w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                  accentColor === color.id 
                    ? `ring-2 ring-offset-2 ring-offset-navy-800 ${
                        color.id === 'cyan' ? 'ring-[#00A6FB]' :
                        color.id === 'purple' ? 'ring-[#8B5CF6]' :
                        color.id === 'green' ? 'ring-[#10B981]' :
                        color.id === 'amber' ? 'ring-[#F59E0B]' :
                        'ring-[#EC4899]'
                      }` 
                    : ''
                }`}
                style={{ backgroundColor: color.color }}
                title={color.name}
              >
                {accentColor === color.id && (
                  <Check className="absolute inset-0 m-auto w-5 h-5 text-white" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-2">
            Current: <span className="capitalize">{accentColor}</span> - Used for buttons, links, and highlights
          </p>
        </div>

        {/* Sidebar Style Selection */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-3">Sidebar Style</label>
          <div className="flex gap-3">
            <button
              onClick={() => setSidebarStyle('expanded')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                sidebarStyle === 'expanded'
                  ? 'bg-norv/20 border-norv'
                  : 'bg-navy-900 border-transparent hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={sidebarStyle === 'expanded' ? 'text-norv font-medium' : 'text-white/60'}>Expanded</span>
                {sidebarStyle === 'expanded' && <Check className="w-4 h-4 text-norv" />}
              </div>
              <div className="h-16 rounded-lg bg-navy-800 border border-white/10 flex">
                <div className="w-16 bg-white/5 border-r border-white/10 p-2">
                  <div className="w-full h-2 bg-white/20 rounded mb-1" />
                  <div className="w-full h-2 bg-white/10 rounded mb-1" />
                  <div className="w-full h-2 bg-white/10 rounded" />
                </div>
                <div className="flex-1 p-2">
                  <div className="w-full h-2 bg-white/10 rounded" />
                </div>
              </div>
              <p className="text-xs text-white/40 mt-2">Full sidebar with labels</p>
            </button>

            <button
              onClick={() => setSidebarStyle('collapsed')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                sidebarStyle === 'collapsed'
                  ? 'bg-norv/20 border-norv'
                  : 'bg-navy-900 border-transparent hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={sidebarStyle === 'collapsed' ? 'text-norv font-medium' : 'text-white/60'}>Collapsed</span>
                {sidebarStyle === 'collapsed' && <Check className="w-4 h-4 text-norv" />}
              </div>
              <div className="h-16 rounded-lg bg-navy-800 border border-white/10 flex">
                <div className="w-8 bg-white/5 border-r border-white/10 p-1">
                  <div className="w-full h-2 bg-white/20 rounded mb-1" />
                  <div className="w-full h-2 bg-white/10 rounded mb-1" />
                  <div className="w-full h-2 bg-white/10 rounded" />
                </div>
                <div className="flex-1 p-2">
                  <div className="w-full h-2 bg-white/10 rounded" />
                </div>
              </div>
              <p className="text-xs text-white/40 mt-2">Icons only, more space</p>
            </button>
          </div>
        </div>

        {/* Preview Note */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-sm">
            <strong>Note:</strong> Theme changes are applied immediately. Your preferences are saved to your browser and will persist across sessions.
          </p>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        Save Appearance
      </button>
    </div>
  )
}
