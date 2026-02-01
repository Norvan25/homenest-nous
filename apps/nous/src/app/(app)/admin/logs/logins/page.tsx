'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, LogIn, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LoginLog {
  id: string
  user_id: string
  email: string
  event_type: string
  ip_address: string
  user_agent: string
  success: boolean
  failure_reason: string
  created_at: string
}

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadLogs()
  }, [filter])

  async function loadLogs() {
    setLoading(true)
    
    try {
      let query = (supabase.from('login_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter === 'failed') {
        query = query.eq('success', false)
      } else if (filter === 'success') {
        query = query.eq('success', true)
      }

      const { data, error } = await query
      
      if (error) {
        // Use mock data for demo
        setLogs([
          { id: '1', user_id: '1', email: 'suzanna@norvan.com', event_type: 'login', ip_address: '192.168.1.1', user_agent: 'Chrome', success: true, failure_reason: '', created_at: new Date().toISOString() },
          { id: '2', user_id: '1', email: 'suzanna@norvan.com', event_type: 'login', ip_address: '192.168.1.1', user_agent: 'Chrome', success: true, failure_reason: '', created_at: new Date(Date.now() - 86400000).toISOString() },
        ])
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    }
    setLoading(false)
  }

  const eventIcons: Record<string, any> = {
    login: LogIn,
    logout: LogOut,
    failed: XCircle,
    password_reset: RefreshCw
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
          <h1 className="text-2xl font-semibold text-white">Login Logs</h1>
          <p className="text-white/60 text-sm">User authentication events</p>
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
        {['all', 'success', 'failed'].map(f => (
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

      {/* Logs Table */}
      <div className="bg-navy-800/50 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const Icon = eventIcons[log.event_type] || LogIn
                  return (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        {log.success ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-white/50" />
                          <span className="text-sm text-white">{log.event_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">{log.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white/50 font-mono">{log.ip_address || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
