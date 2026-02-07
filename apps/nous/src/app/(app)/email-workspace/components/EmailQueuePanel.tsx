'use client'

import { useState } from 'react'
import {
  Mail, Play, Pause, Trash2, Settings, ChevronDown, ChevronUp,
  Loader2, CheckCircle, XCircle, Clock, AlertCircle, MailPlus
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  type EmailQueueData,
  type EmailScenario,
  startEmailSend,
  pauseEmailSend,
  resumeEmailSend,
  clearEmailQueue,
  updateEmailQueueSettings,
} from '@/lib/email-queue-actions'

interface Props {
  queue: EmailQueueData
  scenarios: EmailScenario[]
  onUpdate: () => void
}

export default function EmailQueuePanel({ queue, scenarios, onUpdate }: Props) {
  const { showToast } = useToast()
  const [showSettings, setShowSettings] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const { queueNumber, items, settings, stats } = queue
  const isEmpty = items.length === 0
  const isRunning = settings.is_sending && !settings.is_paused
  const isPaused = settings.is_sending && settings.is_paused

  // Status color for header
  const statusColor = isRunning
    ? 'bg-emerald-500'
    : isPaused
    ? 'bg-amber-500'
    : isEmpty
    ? 'bg-white/20'
    : 'bg-norv'

  const handleSend = async () => {
    setIsSending(true)
    const result = await startEmailSend(queueNumber)
    if (result.success) {
      showToast(result.message, 'success')
    } else {
      showToast(result.message, 'error')
    }
    setIsSending(false)
    onUpdate()
  }

  const handlePause = async () => {
    await pauseEmailSend(queueNumber)
    showToast(`E${queueNumber} paused`, 'info')
    onUpdate()
  }

  const handleResume = async () => {
    await resumeEmailSend(queueNumber)
    showToast(`E${queueNumber} resumed`, 'success')
    onUpdate()
  }

  const handleClear = async () => {
    setIsClearing(true)
    await clearEmailQueue(queueNumber)
    showToast(`E${queueNumber} cleared`, 'success')
    setIsClearing(false)
    onUpdate()
  }

  const handleSettingChange = async (key: string, value: any) => {
    await updateEmailQueueSettings(queueNumber, { [key]: value })
    onUpdate()
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '—'
    if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`
    if (price >= 1_000) return `$${Math.round(price / 1_000)}K`
    return `$${price}`
  }

  // Progress percentage
  const totalItems = stats.total
  const completedItems = stats.sent + stats.failed
  const progressPct = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  return (
    <div className={`bg-navy-800 border rounded-xl overflow-hidden transition-colors ${
      isRunning ? 'border-emerald-500/30' : isPaused ? 'border-amber-500/30' : 'border-white/10'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${isRunning ? 'animate-pulse' : ''}`} />
            <h3 className="text-white font-semibold">
              E{queueNumber}
              {settings.queue_label && settings.queue_label !== `E${queueNumber}` && (
                <span className="text-white/50 font-normal"> — {settings.queue_label}</span>
              )}
            </h3>
            <span className="text-white/40 text-sm">{stats.total} items</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.sent > 0 && (
              <span className="text-emerald-400 text-xs">{stats.sent} sent</span>
            )}
            {stats.failed > 0 && (
              <span className="text-red-400 text-xs">{stats.failed} failed</span>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition ${
                showSettings ? 'bg-norv/20 text-norv' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar (when sending) */}
        {settings.is_sending && totalItems > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>{completedItems} / {totalItems}</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isPaused ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-navy-900/50 border-b border-white/10 space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Scenario</label>
            <select
              value={settings.scenario_key || ''}
              onChange={(e) => handleSettingChange('scenario_key', e.target.value || null)}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-norv/50"
            >
              <option value="">Select scenario...</option>
              {scenarios.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">From Name</label>
              <input
                type="text"
                value={settings.from_name}
                onChange={(e) => handleSettingChange('from_name', e.target.value)}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-norv/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Interval</label>
              <select
                value={settings.send_interval_seconds}
                onChange={(e) => handleSettingChange('send_interval_seconds', parseInt(e.target.value))}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-norv/50"
              >
                <option value={1}>1 second</option>
                <option value={2}>2 seconds</option>
                <option value={3}>3 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Queue Label</label>
            <input
              type="text"
              value={settings.queue_label || ''}
              onChange={(e) => handleSettingChange('queue_label', e.target.value)}
              placeholder={`E${queueNumber}`}
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-norv/50"
            />
          </div>
        </div>
      )}

      {/* Queue Items */}
      <div className="max-h-64 overflow-y-auto">
        {isEmpty ? (
          <div className="p-8 text-center">
            <MailPlus size={32} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/40 text-sm">No leads in queue</p>
            <p className="text-white/30 text-xs mt-1">Add leads from NorCRM</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((item) => (
              <div
                key={item.id}
                className={`px-4 py-2.5 flex items-center gap-3 text-sm ${
                  item.status === 'sent'
                    ? 'bg-emerald-500/5'
                    : item.status === 'failed'
                    ? 'bg-red-500/5'
                    : item.status === 'sending'
                    ? 'bg-norv/5'
                    : ''
                }`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {item.status === 'sent' && <CheckCircle size={14} className="text-emerald-400" />}
                  {item.status === 'failed' && <XCircle size={14} className="text-red-400" />}
                  {item.status === 'sending' && <Loader2 size={14} className="text-norv animate-spin" />}
                  {item.status === 'queued' && <Clock size={14} className="text-white/30" />}
                  {item.status === 'skipped' && <AlertCircle size={14} className="text-amber-400" />}
                </div>

                {/* Position */}
                <span className="text-white/30 w-5 text-right text-xs flex-shrink-0">{item.position}</span>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white truncate">{item.contact_name || 'Unknown'}</span>
                    <span className="text-white/30 text-xs truncate">{item.contact_email}</span>
                  </div>
                  <div className="text-white/40 text-xs truncate">
                    {item.property_address}, {item.property_city}
                  </div>
                </div>

                {/* Price */}
                <span className="text-white/50 text-xs flex-shrink-0">
                  {formatPrice(item.property_price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {!isEmpty && (
        <div className="p-3 border-t border-white/10 flex items-center gap-2">
          {!settings.is_sending ? (
            <button
              onClick={handleSend}
              disabled={isSending || !settings.scenario_key}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              Send {stats.queued}
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResume}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
            >
              <Play size={14} />
              Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition"
            >
              <Pause size={14} />
              Pause
            </button>
          )}
          <button
            onClick={handleClear}
            disabled={isClearing || settings.is_sending}
            className="px-4 py-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 text-sm transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      )}

      {/* Scenario warning */}
      {!isEmpty && !settings.scenario_key && !settings.is_sending && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs">
            <AlertCircle size={12} />
            <span>Select a scenario before sending</span>
          </div>
        </div>
      )}
    </div>
  )
}
