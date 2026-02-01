'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Bot, MoreVertical, Play, Pause, Edit, Trash2, Copy, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Agent {
  id: string
  name: string
  slug: string
  description: string
  type: string
  category: string
  platform: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  version: number
  created_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadAgents()
  }, [filter])

  async function loadAgents() {
    setLoading(true)
    try {
      let query = (supabase.from('ai_agents') as any)
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error loading agents:', error)
        // Use mock data for demo
        setAgents([
          {
            id: '1',
            name: 'Nadia - Outbound Caller',
            slug: 'nadia-outbound',
            description: 'AI agent for outbound cold calls to expired listings',
            type: 'voice',
            category: 'outbound',
            platform: 'elevenlabs',
            status: 'active',
            version: 3,
            created_at: '2026-01-20'
          },
          {
            id: '2',
            name: 'Practice Skeptic',
            slug: 'practice-skeptic',
            description: 'Training persona - skeptical homeowner',
            type: 'practice',
            category: 'training',
            platform: 'elevenlabs',
            status: 'active',
            version: 2,
            created_at: '2026-01-15'
          }
        ])
      } else {
        setAgents(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  async function updateAgentStatus(agentId: string, status: string) {
    try {
      const { error } = await (supabase.from('ai_agents') as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', agentId)

      if (!error) {
        loadAgents()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  async function deleteAgent(agentId: string) {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const { error } = await (supabase.from('ai_agents') as any)
        .delete()
        .eq('id', agentId)

      if (!error) {
        loadAgents()
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-400',
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-amber-500/20 text-amber-400',
    archived: 'bg-red-500/20 text-red-400'
  }

  const typeLabels: Record<string, string> = {
    voice: '🎤 Voice',
    chat: '💬 Chat',
    practice: '🎓 Practice'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">AI Agents</h1>
            <p className="text-white/60 mt-1">Create and manage AI agents for voice, chat, and training</p>
          </div>
        </div>
        <Link
          href="/admin/agents/new"
          className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'active', 'draft', 'paused', 'archived'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-norv/20 text-norv'
                : 'bg-navy-800 text-white/60 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-navy-800/50 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-navy-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-navy-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-navy-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 bg-navy-800/50 rounded-lg border border-white/10">
          <Bot className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/60 mb-4">No agents found</p>
          <Link
            href="/admin/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Agent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div
              key={agent.id}
              className="bg-navy-800/50 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-norv" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{agent.name}</h3>
                    <p className="text-xs text-white/40">{agent.slug}</p>
                  </div>
                </div>
                <div className="relative group">
                  <button className="p-1 hover:bg-white/5 rounded">
                    <MoreVertical className="w-4 h-4 text-white/40" />
                  </button>
                  <div className="absolute right-0 mt-1 w-40 bg-navy-700 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <Link
                      href={`/admin/agents/${agent.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-white/50 mb-3 line-clamp-2">
                {agent.description || 'No description'}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-white/40">
                  {typeLabels[agent.type] || agent.type}
                </span>
                <span className="text-white/20">•</span>
                <span className="text-xs text-white/40">{agent.platform}</span>
                <span className="text-white/20">•</span>
                <span className="text-xs text-white/40">v{agent.version}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[agent.status]}`}>
                  {agent.status}
                </span>
                <div className="flex gap-1">
                  {agent.status === 'active' ? (
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'paused')}
                      className="p-1.5 hover:bg-white/5 rounded"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4 text-amber-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'active')}
                      className="p-1.5 hover:bg-white/5 rounded"
                      title="Activate"
                    >
                      <Play className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
