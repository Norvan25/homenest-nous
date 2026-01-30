'use client'

import { useState, useEffect } from 'react'
import { X, Phone, Clock, FileText, Play, ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

interface Conversation {
  conversation_id: string
  status: string
  start_time?: string
  end_time?: string
  duration_seconds?: number
  transcript?: Array<{
    role: 'agent' | 'user'
    message: string
    timestamp: number
  }>
  analysis?: {
    summary?: string
    outcome?: string
  }
  metadata?: {
    contact_name?: string
    property_address?: string
    queue_item_id?: string
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  agentId: string
  agentName?: string
}

export default function CallHistoryPanel({ isOpen, onClose, agentId, agentName }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    if (isOpen && agentId) {
      loadConversations()
    }
  }, [isOpen, agentId])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/elevenlabs/agents/${agentId}/conversations?limit=50`)
      const data = await response.json()
      
      if (data.conversations) {
        setConversations(data.conversations)
      } else if (data.error) {
        console.error('Error loading conversations:', data.error)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
    setIsLoading(false)
  }

  const loadConversationDetails = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/elevenlabs/conversations/${conversationId}`)
      const data = await response.json()
      setSelectedConversation(data)
    } catch (error) {
      console.error('Error loading conversation details:', error)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20'
      case 'failed': return 'text-red-400 bg-red-500/20'
      case 'in_progress': return 'text-amber-400 bg-amber-500/20'
      default: return 'text-white/60 bg-white/10'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[600px] bg-navy-900 border-l border-white/10 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Call History</h2>
              <p className="text-sm text-white/50">{agentName || 'Agent'} • {conversations.length} calls</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadConversations}
              className="p-2 text-white/50 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Conversation List */}
          <div className={`${selectedConversation ? 'w-1/2' : 'w-full'} overflow-y-auto border-r border-white/5`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">No calls yet</p>
                <p className="text-sm text-white/30 mt-1">Calls will appear here after completion</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => {
                      setSelectedConversation(conv)
                      loadConversationDetails(conv.conversation_id)
                    }}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedConversation?.conversation_id === conv.conversation_id
                        ? 'bg-cyan-500/20 border border-cyan-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(conv.status)}`}>
                        {conv.status}
                      </span>
                      <span className="text-xs text-white/40">{formatDate(conv.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-white/80 truncate">
                        {conv.metadata?.contact_name || 'Unknown Contact'}
                      </span>
                    </div>
                    {conv.metadata?.property_address && (
                      <p className="text-xs text-white/40 mt-1 truncate">{conv.metadata.property_address}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(conv.duration_seconds)}
                      </span>
                      {conv.analysis?.outcome && (
                        <span className="flex items-center gap-1">
                          {conv.analysis.outcome === 'interested' ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-white/40" />
                          )}
                          {conv.analysis.outcome}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversation Detail */}
          {selectedConversation && (
            <div className="w-1/2 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-white/70 mb-4">Transcript</h3>
              
              {selectedConversation.analysis?.summary && (
                <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <p className="text-xs text-cyan-400 font-medium mb-1">Summary</p>
                  <p className="text-sm text-white/80">{selectedConversation.analysis.summary}</p>
                </div>
              )}

              {selectedConversation.transcript && selectedConversation.transcript.length > 0 ? (
                <div className="space-y-3">
                  {selectedConversation.transcript.map((entry, index) => (
                    <div 
                      key={index}
                      className={`flex ${entry.role === 'agent' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                        entry.role === 'agent'
                          ? 'bg-cyan-500/20 text-white/90'
                          : 'bg-white/10 text-white/80'
                      }`}>
                        <p className="text-xs text-white/40 mb-1">
                          {entry.role === 'agent' ? 'AI Agent' : 'Contact'}
                        </p>
                        <p>{entry.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-white/40 py-8">No transcript available</p>
              )}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-navy-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-white/50">
                Completed: <span className="text-green-400">{conversations.filter(c => c.status === 'completed').length}</span>
              </span>
              <span className="text-white/50">
                Failed: <span className="text-red-400">{conversations.filter(c => c.status === 'failed').length}</span>
              </span>
            </div>
            <span className="text-white/40">
              Total duration: {formatDuration(conversations.reduce((sum, c) => sum + (c.duration_seconds || 0), 0))}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
