'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Activity, Clock, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ApiLog {
  id: string
  endpoint: string
  method: string
  service: string
  status_code: number
  latency_ms: number
  request_body: any
  response_body: any
  error: string | null
  created_at: string
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null)

  useEffect(() => {
    loadLogs()
  }, [filter])

  async function loadLogs() {
    setLoading(true)
    
    try {
      let query = (supabase.from('api_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter === 'errors') {
        query = query.gte('status_code', 400)
      } else if (filter !== 'all') {
        query = query.eq('service', filter)
      }

      const { data, error } = await query
      
      if (error) {
        // Use mock data for demo
        setLogs([
          { id: '1', endpoint: '/api/nordosc/generate', method: 'POST', service: 'anthropic', status_code: 200, latency_ms: 2340, request_body: { type: 'email' }, response_body: { content: '...' }, error: null, created_at: new Date().toISOString() },
          { id: '2', endpoint: '/api/norw/call', method: 'POST', service: 'elevenlabs', status_code: 200, latency_ms: 540, request_body: {}, response_body: {}, error: null, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', endpoint: '/api/norguide/chat', method: 'POST', service: 'anthropic', status_code: 429, latency_ms: 120, request_body: {}, response_body: {}, error: 'Rate limit exceeded', created_at: new Date(Date.now() - 7200000).toISOString() },
        ])
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    }
    setLoading(false)
  }

  const methodColors: Record<string, string> = {
    GET: 'text-green-400',
    POST: 'text-blue-400',
    PUT: 'text-amber-400',
    DELETE: 'text-red-400'
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
          <h1 className="text-2xl font-semibold text-white">API Logs</h1>
          <p className="text-white/60 text-sm">External API calls and responses</p>
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
        {['all', 'anthropic', 'elevenlabs', 'supabase', 'errors'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-norv/20 text-norv'
                : 'bg-navy-800 text-white/60 hover:text-white'
            }`}
          >
            {f === 'errors' ? '⚠️ Errors' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Calls List */}
        <div className="lg:col-span-2 bg-navy-800/50 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Endpoint</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Latency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                      No API logs found
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
                        {log.status_code < 400 ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-mono ${methodColors[log.method] || 'text-white'}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-mono truncate max-w-[200px]">
                        {log.endpoint}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">{log.service}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/40" />
                          <span className={`text-sm ${
                            log.latency_ms < 500 ? 'text-green-400' :
                            log.latency_ms < 2000 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {log.latency_ms}ms
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4">
          {selectedLog ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white/50">Endpoint</h3>
                <p className="text-white font-mono text-sm break-all">{selectedLog.endpoint}</p>
              </div>

              <div className="flex gap-4">
                <div>
                  <h3 className="text-sm font-medium text-white/50">Status</h3>
                  <p className={`font-mono ${selectedLog.status_code < 400 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedLog.status_code}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/50">Latency</h3>
                  <p className="text-white">{selectedLog.latency_ms}ms</p>
                </div>
              </div>

              {selectedLog.error && (
                <div>
                  <h3 className="text-sm font-medium text-red-400">Error</h3>
                  <p className="text-red-300 text-sm">{selectedLog.error}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-white/50 mb-2">Request</h3>
                <pre className="bg-navy-900 rounded-lg p-3 text-xs text-white/60 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedLog.request_body, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/50 mb-2">Response</h3>
                <pre className="bg-navy-900 rounded-lg p-3 text-xs text-white/60 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedLog.response_body, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/50">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select a request to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
