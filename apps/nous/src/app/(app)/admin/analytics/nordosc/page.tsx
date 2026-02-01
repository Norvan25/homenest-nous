'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BarChart3, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, 
  Mail, MessageSquare, Send, Eye, Reply, RefreshCw, Sparkles,
  ArrowLeft
} from 'lucide-react'
import { nordoscLogger } from '@/lib/nordosc-logger'

interface ScenarioMetric {
  scenario_key: string
  scenario_name: string
  content_type: string
  total_generations: number
  total_sends: number
  total_responses: number
  open_rate: number
  response_rate: number
  positive_responses: number
  negative_responses: number
  avg_rating: number
  thumbs_up: number
  thumbs_down: number
}

export default function NordoscAnalyticsPage() {
  const [metrics, setMetrics] = useState<ScenarioMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadMetrics()
  }, [timeRange])

  async function loadMetrics() {
    setLoading(true)
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const data = await nordoscLogger.getScenarioPerformance(days)
    setMetrics(data)
    setLoading(false)
  }

  // Calculate totals
  const totals = metrics.reduce(
    (acc, m) => ({
      generations: acc.generations + (m.total_generations || 0),
      sends: acc.sends + (m.total_sends || 0),
      responses: acc.responses + (m.total_responses || 0),
      thumbsUp: acc.thumbsUp + (m.thumbs_up || 0),
      thumbsDown: acc.thumbsDown + (m.thumbs_down || 0),
    }),
    { generations: 0, sends: 0, responses: 0, thumbsUp: 0, thumbsDown: 0 }
  )

  const avgOpenRate = metrics.length 
    ? (metrics.reduce((sum, m) => sum + (m.open_rate || 0), 0) / metrics.length).toFixed(1)
    : '0'
    
  const avgResponseRate = metrics.length
    ? (metrics.reduce((sum, m) => sum + (m.response_rate || 0), 0) / metrics.length).toFixed(1)
    : '0'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/analytics" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">NorDOSC Analytics</h1>
            <p className="text-white/50 mt-1">Content performance and feedback insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-navy-800 border border-white/10 rounded-lg text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={loadMetrics}
            className="p-2 bg-navy-800 hover:bg-navy-700 border border-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-navy-800 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-norv/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-norv" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totals.generations}</p>
              <p className="text-sm text-white/50">Generations</p>
            </div>
          </div>
        </div>

        <div className="bg-navy-800 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totals.sends}</p>
              <p className="text-sm text-white/50">Sent</p>
            </div>
          </div>
        </div>

        <div className="bg-navy-800 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Eye className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{avgOpenRate}%</p>
              <p className="text-sm text-white/50">Open Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-navy-800 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Reply className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{avgResponseRate}%</p>
              <p className="text-sm text-white/50">Response Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-navy-800 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {totals.thumbsUp} / {totals.thumbsDown}
              </p>
              <p className="text-sm text-white/50">Feedback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Performance Table */}
      <div className="bg-navy-800 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">Scenario Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-navy-900">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Scenario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Generated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Sent</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Open Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Response Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Positive</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white/50 uppercase">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/50">
                    Loading analytics...
                  </td>
                </tr>
              ) : metrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/50">
                    No data yet. Generate some content to see analytics.
                  </td>
                </tr>
              ) : (
                metrics.map((m) => (
                  <tr key={m.scenario_key} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{m.scenario_name}</p>
                      <p className="text-xs text-white/40">{m.scenario_key}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        m.content_type === 'email' ? 'bg-blue-500/20 text-blue-400' :
                        m.content_type === 'sms' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {m.content_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">{m.total_generations || 0}</td>
                    <td className="px-4 py-3 text-right text-white">{m.total_sends || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${
                        (m.open_rate || 0) >= 40 ? 'text-green-400' :
                        (m.open_rate || 0) >= 20 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {m.open_rate?.toFixed(1) || '0'}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${
                        (m.response_rate || 0) >= 15 ? 'text-green-400' :
                        (m.response_rate || 0) >= 5 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {m.response_rate?.toFixed(1) || '0'}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {m.positive_responses || 0} / {m.total_responses || 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <ThumbsUp className="w-3 h-3" />
                          {m.thumbs_up || 0}
                        </span>
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <ThumbsDown className="w-3 h-3" />
                          {m.thumbs_down || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-sm">
          <strong>Note:</strong> This dashboard shows performance metrics for AI-generated content. 
          Open rates and response rates require email tracking integration (via n8n webhooks). 
          Feedback data is collected from user thumbs up/down ratings.
        </p>
      </div>
    </div>
  )
}
