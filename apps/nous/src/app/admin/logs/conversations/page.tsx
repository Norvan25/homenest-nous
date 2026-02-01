'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Phone, MessageSquare, Flag, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ConversationLog {
  id: string
  agent_id: string
  agent_name?: string
  session_id: string
  platform: string
  type: string
  direction: string
  transcript: any[]
  summary: string
  started_at: string
  ended_at: string
  duration_seconds: number
  message_count: number
  outcome: string
  disposition: string
  sentiment: string
  quality_score: number
  flagged: boolean
}

export default function ConversationLogsPage() {
  const [logs, setLogs] = useState<ConversationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null)

  useEffect(() => {
    loadLogs()
  }, [filter])

  async function loadLogs() {
    setLoading(true)
    
    try {
      let query = (supabase.from('conversation_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter === 'flagged') {
        query = query.eq('flagged', true)
      } else if (filter !== 'all') {
        query = query.eq('type', filter)
      }

      const { data, error } = await query
      
      if (error) {
        // Use mock data for demo
        setLogs([
          {
            id: '1',
            agent_id: '1',
            agent_name: 'Nadia',
            session_id: 'sess_123',
            platform: 'elevenlabs',
            type: 'call',
            direction: 'outbound',
            transcript: [
              { role: 'assistant', content: 'Hi, this is Nadia from HomeNest...' },
              { role: 'user', content: 'Hello, yes I got your call...' }
            ],
            summary: 'Cold call to expired listing. Homeowner interested but needs to discuss with spouse.',
            started_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
            duration_seconds: 245,
            message_count: 12,
            outcome: 'callback',
            disposition: 'interested',
            sentiment: 'positive',
            quality_score: 85,
            flagged: false
          }
        ])
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    }
    setLoading(false)
  }

  function formatDuration(seconds: number): string {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const sentimentColors: Record<string, string> = {
    positive: 'text-green-400',
    neutral: 'text-white/50',
    negative: 'text-red-400'
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/logs"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-white">Conversation Logs</h1>
          <p className="text-white/60 text-sm">AI agent conversations and transcripts</p>
        </div>
        <button
          onClick={() => loadLogs()}
          className="flex items-center gap-2 px-3 py-2 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm text-white/80">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'call', 'chat', 'practice', 'flagged'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-norv/20 text-norv'
                : 'bg-navy-800 text-white/60 hover:text-white'
            }`}
          >
            {f === 'flagged' ? '🚩 Flagged' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-2 bg-navy-800/50 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Outcome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Time</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-white/50">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-white/50">
                      No conversations found
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr
                      key={log.id}
                      className={`hover:bg-white/5 cursor-pointer ${
                        selectedLog?.id === log.id ? 'bg-white/5' : ''
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {log.type === 'call' ? (
                            <Phone className="w-4 h-4 text-norv" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-green-400" />
                          )}
                          {log.flagged && <Flag className="w-3 h-3 text-red-400" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {log.agent_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {formatDuration(log.duration_seconds)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${
                          log.disposition === 'appointment' ? 'text-green-400' :
                          log.disposition === 'not_interested' ? 'text-red-400' :
                          'text-white/50'
                        }`}>
                          {log.disposition || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.quality_score ? (
                          <span className={`text-sm ${
                            log.quality_score >= 70 ? 'text-green-400' :
                            log.quality_score >= 40 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {log.quality_score}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {log.started_at ? new Date(log.started_at).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversation Detail */}
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
          {selectedLog ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white/50">Session ID</h3>
                <p className="text-white font-mono text-sm">{selectedLog.session_id || '-'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/50">Summary</h3>
                <p className="text-white text-sm">{selectedLog.summary || 'No summary available'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/50">Sentiment</h3>
                <p className={`text-sm ${sentimentColors[selectedLog.sentiment] || 'text-white/50'}`}>
                  {selectedLog.sentiment || '-'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/50 mb-2">Transcript</h3>
                <div className="bg-navy-900 rounded-lg p-3 max-h-80 overflow-y-auto space-y-2">
                  {selectedLog.transcript && selectedLog.transcript.length > 0 ? (
                    selectedLog.transcript.map((msg: any, i: number) => (
                      <div key={i} className={`text-sm ${msg.role === 'assistant' ? 'text-norv' : 'text-white/80'}`}>
                        <span className="font-medium">{msg.role}: </span>
                        {msg.content}
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm">No transcript available</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/50">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select a conversation to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
