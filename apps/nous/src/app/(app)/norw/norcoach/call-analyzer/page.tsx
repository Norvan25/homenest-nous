'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Filter, Play, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface CallLog {
  id: string
  agent_name: string
  phone_number: string
  duration: number
  outcome: string
  score?: number
  created_at: string
}

export default function CallAnalyzerPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCallLogs()
  }, [])

  const fetchCallLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/norw/call-logs')
      const data = await response.json()
      if (data.callLogs) {
        setCallLogs(data.callLogs)
      }
    } catch (error) {
      console.error('Failed to fetch call logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeCall = async (callId: string) => {
    try {
      const response = await fetch('/api/norw/call-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: callId, analyzeWithClaude: true }),
      })
      const data = await response.json()
      if (data.callLog) {
        setSelectedCall(data.callLog)
      }
    } catch (error) {
      console.error('Failed to analyze call:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link
          href="/norw/norcoach"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-2"
        >
          <ArrowLeft size={16} />
          Back to NorCoach
        </Link>
        <h1 className="text-2xl font-semibold">Call Analyzer</h1>
        <p className="text-white/60">Analyze call recordings and get AI insights</p>
      </div>

      <div className="p-6">
        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search calls..."
              className="w-full bg-navy-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-navy-800 border border-white/10 rounded-lg text-sm hover:bg-white/5">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Call List */}
          <div className="col-span-5">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="font-medium">Recent Calls</h2>
              </div>
              
              {isLoading ? (
                <div className="p-8 text-center text-white/40">Loading...</div>
              ) : callLogs.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {callLogs.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                        selectedCall?.id === call.id ? 'bg-white/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{call.agent_name || 'Unknown Agent'}</span>
                        <span className="text-sm text-white/40">{formatDuration(call.duration)}</span>
                      </div>
                      <div className="text-sm text-white/60">{call.phone_number}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          call.outcome === 'completed' ? 'bg-green-500/20 text-green-400' :
                          call.outcome === 'no_answer' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {call.outcome || 'Unknown'}
                        </span>
                        {call.score && (
                          <span className="text-xs text-white/40">Score: {call.score}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-white/40">No calls found</div>
              )}
            </div>
          </div>

          {/* Right: Analysis View */}
          <div className="col-span-7">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-6 min-h-[500px]">
              {selectedCall ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-medium">Call Analysis</h2>
                    <button
                      onClick={() => analyzeCall(selectedCall.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-norw text-white rounded-lg text-sm hover:bg-norw/80"
                    >
                      <BarChart3 size={16} />
                      Analyze with AI
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-white/40 mb-1">Duration</div>
                        <div className="text-xl font-semibold">{formatDuration(selectedCall.duration)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-white/40 mb-1">Outcome</div>
                        <div className="text-xl font-semibold capitalize">{selectedCall.outcome || 'Unknown'}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-white/40 mb-1">Score</div>
                        <div className="text-xl font-semibold">{selectedCall.score || '-'}</div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-sm text-white/40 mb-2">Phone Number</div>
                      <div>{selectedCall.phone_number}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-sm text-white/40 mb-2">Date</div>
                      <div>{new Date(selectedCall.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select a call to view analysis</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
