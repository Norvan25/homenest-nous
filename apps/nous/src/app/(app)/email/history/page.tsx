'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { 
  ArrowLeft, Mail, RefreshCw, Eye, Send, AlertCircle, 
  CheckCircle, Clock, XCircle, MessageSquare, ExternalLink
} from 'lucide-react'

interface OutreachSend {
  id: string
  thread_id: string
  recipient_email: string
  recipient_name: string
  subject: string
  body: string
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed'
  sent_at: string | null
  opened_at: string | null
  created_at: string
}

interface OutreachResponse {
  id: string
  thread_id: string
  sentiment: string
  intent: string
  response_text: string
  suggested_reply: string
  received_at: string
}

export default function EmailHistoryPage() {
  const [sends, setSends] = useState<OutreachSend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSend, setSelectedSend] = useState<OutreachSend | null>(null)
  const [responses, setResponses] = useState<OutreachResponse[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchSends()
  }, [])

  async function fetchSends() {
    setLoading(true)
    const { data } = await supabase
      .from('outreach_sends')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    setSends(data || [])
    setLoading(false)
  }

  async function viewDetails(send: OutreachSend) {
    setSelectedSend(send)
    setLoadingResponses(true)

    // Fetch any responses for this thread
    const { data } = await supabase
      .from('outreach_responses')
      .select('*')
      .eq('thread_id', send.thread_id)
      .order('received_at', { ascending: true })

    setResponses(data || [])
    setLoadingResponses(false)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'sent':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
            <Send className="w-3 h-3" />
            Sent
          </span>
        )
      case 'delivered':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
            <CheckCircle className="w-3 h-3" />
            Delivered
          </span>
        )
      case 'opened':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
            <Eye className="w-3 h-3" />
            Opened
          </span>
        )
      case 'bounced':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
            <XCircle className="w-3 h-3" />
            Bounced
          </span>
        )
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 bg-white/10 text-white/50 rounded text-xs">
            {status}
          </span>
        )
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/email" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Email History</h1>
            <p className="text-white/50 text-sm">Track sent emails and responses</p>
          </div>
        </div>
        <button
          onClick={fetchSends}
          className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-6">
        {/* Email List */}
        <div className="flex-1 bg-navy-800 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-navy-900">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Sent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                      Loading...
                    </td>
                  </tr>
                ) : sends.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <Mail className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-white/50">No emails sent yet</p>
                      <Link href="/email" className="text-norv text-sm hover:underline mt-2 inline-block">
                        Send your first bulk email
                      </Link>
                    </td>
                  </tr>
                ) : (
                  sends.map(send => (
                    <tr 
                      key={send.id} 
                      className={`hover:bg-white/5 cursor-pointer transition-colors ${
                        selectedSend?.id === send.id ? 'bg-norv/10' : ''
                      }`}
                      onClick={() => viewDetails(send)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-white text-sm">{send.recipient_name || 'Unknown'}</div>
                        <div className="text-white/50 text-xs">{send.recipient_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white text-sm truncate max-w-[200px]">
                          {send.subject || '(No subject)'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(send.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {formatDate(send.sent_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50">
                        {formatDate(send.opened_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedSend && (
          <div className="w-96 bg-navy-800 border border-white/10 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">Email Details</h3>
                {getStatusBadge(selectedSend.status)}
              </div>
              <p className="text-sm text-white/50">{selectedSend.recipient_email}</p>
            </div>

            <div className="p-4 border-b border-white/10">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Subject</div>
              <div className="text-white">{selectedSend.subject || '(No subject)'}</div>
            </div>

            <div className="p-4 border-b border-white/10 max-h-[300px] overflow-y-auto">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Message</div>
              <div className="text-sm text-white/80 whitespace-pre-wrap">
                {selectedSend.body || '(No content)'}
              </div>
            </div>

            {/* Responses */}
            <div className="p-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Responses
              </div>
              {loadingResponses ? (
                <p className="text-sm text-white/50">Loading...</p>
              ) : responses.length === 0 ? (
                <p className="text-sm text-white/40">No responses yet</p>
              ) : (
                <div className="space-y-3">
                  {responses.map(resp => (
                    <div key={resp.id} className="p-3 bg-navy-900 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          resp.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                          resp.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                          'bg-white/10 text-white/50'
                        }`}>
                          {resp.sentiment || 'unknown'}
                        </span>
                        {resp.intent && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                            {resp.intent}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/70">{resp.response_text}</p>
                      <div className="text-xs text-white/40 mt-2">
                        {formatDate(resp.received_at)}
                      </div>
                      {resp.suggested_reply && (
                        <div className="mt-2 p-2 bg-norv/10 rounded text-xs text-norv">
                          <strong>Suggested reply:</strong> {resp.suggested_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
