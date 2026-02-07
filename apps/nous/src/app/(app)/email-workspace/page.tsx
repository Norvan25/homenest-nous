'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, RefreshCw, Settings } from 'lucide-react'
import EmailQueuePanel from './components/EmailQueuePanel'
import {
  fetchEmailQueues,
  fetchScenarios,
  type EmailQueueData,
  type EmailScenario,
} from '@/lib/email-queue-actions'

export default function EmailWorkspacePage() {
  const [queues, setQueues] = useState<EmailQueueData[]>([])
  const [scenarios, setScenarios] = useState<EmailScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    const [queueData, scenarioData] = await Promise.all([
      fetchEmailQueues(),
      fetchScenarios(),
    ])
    setQueues(queueData)
    setScenarios(scenarioData)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh when any queue is sending
  useEffect(() => {
    const anySending = queues.some(q => q.settings.is_sending)
    if (!anySending) return

    const interval = setInterval(async () => {
      const queueData = await fetchEmailQueues()
      setQueues(queueData)
    }, 3000)

    return () => clearInterval(interval)
  }, [queues])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleQueueUpdate = async () => {
    const queueData = await fetchEmailQueues()
    setQueues(queueData)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-norv/30 border-t-norv rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading email workspace...</p>
        </div>
      </div>
    )
  }

  const totalQueued = queues.reduce((sum, q) => sum + q.stats.queued, 0)
  const totalSent = queues.reduce((sum, q) => sum + q.stats.sent, 0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-norv" />
              <h1 className="text-2xl font-bold text-white">Email Workspace</h1>
            </div>
            <p className="text-white/50">
              {totalQueued > 0 ? `${totalQueued} emails queued` : 'No emails queued'}
              {totalSent > 0 && ` · ${totalSent} sent`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {queues.map(queue => (
          <EmailQueuePanel
            key={queue.queueNumber}
            queue={queue}
            scenarios={scenarios}
            onUpdate={handleQueueUpdate}
          />
        ))}
      </div>
    </div>
  )
}
