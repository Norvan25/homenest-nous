'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, AlertCircle, Info, AlertTriangle, Bug, Skull } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DebugLog {
  id: string
  level: string
  message: string
  service: string
  metadata: any
  request_id: string
  created_at: string
}

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadLogs()
  }, [filter])

  async function loadLogs() {
    setLoading(true)
    
    try {
      let query = (supabase.from('debug_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') {
        query = query.eq('level', filter)
      }

      const { data, error } = await query
      
      if (error) {
        // Use mock data for demo
        setLogs([
          { id: '1', level: 'error', message: 'Failed to connect to ElevenLabs API', service: 'voice', metadata: { error: 'timeout' }, request_id: 'req_123', created_at: new Date().toISOString() },
          { id: '2', level: 'warn', message: 'Rate limit approaching', service: 'nordosc', metadata: { remaining: 10 }, request_id: 'req_124', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', level: 'info', message: 'Document generated successfully', service: 'nordosc', metadata: { type: 'email' }, request_id: 'req_125', created_at: new Date(Date.now() - 7200000).toISOString() },
        ])
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    }
    setLoading(false)
  }

  const levelIcons: Record<string, any> = {
    debug: Bug,
    info: Info,
    warn: AlertTriangle,
    error: AlertCircle,
    fatal: Skull
  }

  const levelColors: Record<string, string> = {
    debug: 'text-gray-400 bg-gray-500/20',
    info: 'text-blue-400 bg-blue-500/20',
    warn: 'text-amber-400 bg-amber-500/20',
    error: 'text-red-400 bg-red-500/20',
    fatal: 'text-red-500 bg-red-500/20'
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
          <h1 className="text-2xl font-semibold text-white">Debug Logs</h1>
          <p className="text-white/60 text-sm">Application errors and debug information</p>
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
        {['all', 'error', 'warn', 'info', 'debug'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-norv/20 text-norv'
                : 'bg-navy-800 text-white/60 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Logs List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-white/50">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-white/50">No logs found</div>
        ) : (
          logs.map(log => {
            const Icon = levelIcons[log.level] || Info
            return (
              <div
                key={log.id}
                className="bg-navy-800/50 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${levelColors[log.level]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium uppercase ${levelColors[log.level]?.split(' ')[0]}`}>
                        {log.level}
                      </span>
                      <span className="text-xs text-white/40">{log.service}</span>
                      <span className="text-xs text-white/30">|</span>
                      <span className="text-xs text-white/40 font-mono">{log.request_id}</span>
                    </div>
                    <p className="text-white">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-2 p-2 bg-navy-900 rounded text-xs text-white/60 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                    <p className="text-xs text-white/30 mt-2">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
