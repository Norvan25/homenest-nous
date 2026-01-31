'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Phone, Play, Clock, Trash2, Pause, Settings, CheckCircle, XCircle, Loader2, History, PhoneOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import CallQueueItem from './CallQueueItem'
import CallHistoryPanel from './CallHistoryPanel'

interface QueueItem {
  id: string
  phone_number: string
  contact_name: string | null
  property_address: string
  position: number
  status: string
  scheduled_for: string | null
  conversation_id?: string
  call_outcome?: string
}

interface ActiveCall {
  queueItemId: string
  conversationId: string
  contactName: string | null
  phoneNumber: string
  startedAt: Date
}

interface Agent {
  agent_id: string
  name: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CallQueuePanel({ isOpen, onClose }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCalling, setIsCalling] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentCallIndex, setCurrentCallIndex] = useState(-1)
  const [callStatus, setCallStatus] = useState<string>('')
  
  // Active call tracking
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  
  // Agent selection
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [showAgentSelect, setShowAgentSelect] = useState(false)
  const [loadingAgents, setLoadingAgents] = useState(false)
  
  // Stats
  const [completedCalls, setCompletedCalls] = useState(0)
  const [failedCalls, setFailedCalls] = useState(0)
  
  // History panel
  const [showHistory, setShowHistory] = useState(false)
  
  const abortRef = useRef(false)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load queue
  useEffect(() => {
    if (isOpen) {
      loadQueue()
      loadAgents()
      
      // Auto-refresh queue every 5 seconds while panel is open
      const refreshInterval = setInterval(() => {
        loadQueue()
      }, 5000)
      
      return () => clearInterval(refreshInterval)
    }
  }, [isOpen])

  // Detect active calls from queue (for when page reloads during a call)
  useEffect(() => {
    const callingItem = queue.find(q => q.status === 'calling')
    if (callingItem && !activeCall && callingItem.conversation_id) {
      console.log('Found active call in queue:', callingItem)
      setActiveCall({
        queueItemId: callingItem.id,
        conversationId: callingItem.conversation_id,
        contactName: callingItem.contact_name,
        phoneNumber: callingItem.phone_number,
        startedAt: new Date(), // Approximate
      })
    }
    // Clear active call if no calling items in queue
    if (!callingItem && activeCall) {
      console.log('No calling items, clearing active call')
      setActiveCall(null)
      setCallStatus('Call completed')
    }
  }, [queue, activeCall])

  // Call duration timer + status polling
  useEffect(() => {
    if (activeCall) {
      // Duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - activeCall.startedAt.getTime()) / 1000))
      }, 1000)
      
      // Poll for call status every 3 seconds
      const pollStatus = async () => {
        try {
          const response = await fetch(`/api/elevenlabs/call/${activeCall.conversationId}`)
          const data = await response.json()
          console.log('Call status poll:', data)
          
          // Check if call has ended
          if (data.status === 'done' || data.status === 'ended' || data.status === 'failed') {
            console.log('Call ended, status:', data.status)
            setActiveCall(null)
            setCallStatus(`Call ${data.status}`)
            
            // Update queue
            setQueue(prev => prev.map(item => 
              item.id === activeCall.queueItemId 
                ? { ...item, status: 'completed', call_outcome: data.analysis?.outcome || data.status }
                : item
            ))
            
            // Refresh queue from DB
            loadQueue()
          }
        } catch (error) {
          console.error('Error polling call status:', error)
        }
      }
      
      const pollInterval = setInterval(pollStatus, 3000)
      
      return () => {
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
        clearInterval(pollInterval)
      }
    } else {
      setCallDuration(0)
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [activeCall])

  const loadQueue = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('call_queue')
      .select('*')
      .in('status', ['queued', 'calling'])
      .order('position', { ascending: true })
    
    if (!error && data) {
      setQueue(data)
    }
    setIsLoading(false)
  }

  const loadAgents = async () => {
    setLoadingAgents(true)
    try {
      const response = await fetch('/api/elevenlabs/agents')
      const data = await response.json()
      if (data.agents) {
        setAgents(data.agents)
        if (data.agents.length > 0 && !selectedAgentId) {
          setSelectedAgentId(data.agents[0].agent_id)
        }
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    }
    setLoadingAgents(false)
  }

  const removeFromQueue = async (id: string) => {
    await supabase.from('call_queue').delete().eq('id', id)
    setQueue(queue.filter(item => item.id !== id))
  }

  const clearQueue = async () => {
    if (!confirm('Clear all items from the call queue?')) return
    await supabase.from('call_queue').delete().eq('status', 'queued')
    setQueue([])
  }

  const initiateCall = async (queueItem: QueueItem): Promise<boolean> => {
    try {
      console.log('=== INITIATING CALL FROM UI ===')
      console.log('Queue item:', queueItem)
      console.log('Agent ID:', selectedAgentId)
      
      setCallStatus(`Calling ${queueItem.contact_name || queueItem.phone_number}...`)
      
      const requestBody = {
        queueItemId: queueItem.id,
        agentId: selectedAgentId,
      }
      console.log('Request body:', requestBody)
      
      const response = await fetch('/api/elevenlabs/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      // Show debug info in console
      if (data.debug) {
        console.log('=== DEBUG LOG FROM SERVER ===')
        data.debug.forEach((log: string) => console.log(log))
      }

      if (data.success) {
        console.log('Call initiated successfully, conversation ID:', data.conversationId)
        // Track active call
        setActiveCall({
          queueItemId: queueItem.id,
          conversationId: data.conversationId,
          contactName: queueItem.contact_name,
          phoneNumber: queueItem.phone_number,
          startedAt: new Date(),
        })
        // Update local state
        setQueue(prev => prev.map(item => 
          item.id === queueItem.id 
            ? { ...item, status: 'calling', conversation_id: data.conversationId }
            : item
        ))
        return true
      } else {
        console.error('Call failed:', data.error)
        console.error('Debug info:', data.debug)
        setCallStatus(`Failed: ${data.error}`)
        setFailedCalls(prev => prev + 1)
        
        // Show alert with debug info for troubleshooting
        alert(`Call failed: ${data.error}\n\nCheck browser console (F12) for debug details.`)
        return false
      }
    } catch (error: any) {
      console.error('Exception initiating call:', error)
      setCallStatus(`Error: ${error.message}`)
      setFailedCalls(prev => prev + 1)
      alert(`Error initiating call: ${error.message}`)
      return false
    }
  }

  const startCalling = async () => {
    if (queue.length === 0) return
    
    if (!selectedAgentId) {
      setShowAgentSelect(true)
      alert('Please select an AI agent first')
      return
    }

    setIsCalling(true)
    setIsPaused(false)
    abortRef.current = false
    setCompletedCalls(0)
    setFailedCalls(0)

    const queuedItems = queue.filter(item => item.status === 'queued')

    for (let i = 0; i < queuedItems.length; i++) {
      if (abortRef.current || isPaused) break

      setCurrentCallIndex(i)
      const item = queuedItems[i]

      const success = await initiateCall(item)

      if (success) {
        setCompletedCalls(prev => prev + 1)
        // Wait for call to complete (poll or just wait a bit)
        // In production, the webhook handles completion
        setCallStatus(`Call initiated to ${item.contact_name || item.phone_number}`)
        
        // Wait between calls (adjust as needed)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

      // Check for pause/abort again
      if (abortRef.current) break
    }

    setIsCalling(false)
    setCurrentCallIndex(-1)
    setCallStatus(abortRef.current ? 'Stopped' : 'All calls completed')
    
    // Refresh queue
    loadQueue()
  }

  const pauseCalling = () => {
    setIsPaused(true)
    setCallStatus('Paused')
  }

  const resumeCalling = () => {
    setIsPaused(false)
    startCalling()
  }

  const stopCalling = () => {
    abortRef.current = true
    setIsCalling(false)
    setIsPaused(false)
    setCurrentCallIndex(-1)
    setCallStatus('Stopped')
    // End active call if any
    if (activeCall) {
      endCurrentCall()
    }
  }

  const endCurrentCall = async () => {
    if (!activeCall) return
    
    setCallStatus('Ending call...')
    
    try {
      // Try to end via ElevenLabs API
      const response = await fetch(`/api/elevenlabs/call/${activeCall.conversationId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      console.log('End call response:', data)
      
      // Update DB - only status field to avoid column errors
      const { error } = await (supabase
        .from('call_queue') as any)
        .update({ status: 'cancelled' })
        .eq('id', activeCall.queueItemId)
      
      if (error) {
        console.error('Supabase update error:', error)
      }
      
      // Update local state
      setQueue(prev => prev.map(item => 
        item.id === activeCall.queueItemId 
          ? { ...item, status: 'cancelled' }
          : item
      ))
      
      setCallStatus('Call ended')
    } catch (error: any) {
      console.error('Error ending call:', error)
      setCallStatus(`Error ending call: ${error.message}`)
    } finally {
      setActiveCall(null)
      loadQueue() // Refresh queue
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  const queuedCount = queue.filter(q => q.status === 'queued').length
  const callingCount = queue.filter(q => q.status === 'calling').length

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[450px] bg-navy-900 border-l border-white/10 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isCalling ? 'bg-green-500/30 animate-pulse' : 'bg-green-500/20'
            }`}>
              <Phone className={`w-5 h-5 ${isCalling ? 'text-green-300' : 'text-green-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Call Queue</h2>
              <p className="text-sm text-white/50">
                {queuedCount} queued {callingCount > 0 && `• ${callingCount} calling`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agent Selection */}
        <div className="px-4 py-3 border-b border-white/5 bg-navy-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">AI Agent:</span>
            <div className="flex items-center gap-2">
              {loadingAgents ? (
                <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
              ) : agents.length === 0 ? (
                <span className="text-sm text-amber-400">No agents configured</span>
              ) : (
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  disabled={isCalling}
                  className="bg-navy-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500/50"
                >
                  {agents.map(agent => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowHistory(true)}
                disabled={!selectedAgentId}
                className="p-1.5 text-white/40 hover:text-cyan-400 disabled:opacity-30 transition"
                title="View call history"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open('/api/elevenlabs/agents', '_blank')}
                className="p-1.5 text-white/40 hover:text-white transition"
                title="Manage agents"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Call Banner - shows for activeCall OR any item with calling status */}
        {(activeCall || callingCount > 0) && (
          <div className="px-4 py-4 border-b border-green-500/30 bg-gradient-to-r from-green-500/20 to-green-600/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {activeCall?.contactName || activeCall?.phoneNumber || queue.find(q => q.status === 'calling')?.contact_name || queue.find(q => q.status === 'calling')?.phone_number || 'Active Call'}
                  </p>
                  <p className="text-sm text-green-300">
                    {activeCall ? `In call • ${formatDuration(callDuration)}` : 'Call in progress...'}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (activeCall) {
                    await endCurrentCall()
                  } else {
                    // End the calling item directly
                    const callingItem = queue.find(q => q.status === 'calling')
                    if (callingItem) {
                      setCallStatus('Ending call...')
                      if (callingItem.conversation_id) {
                        await fetch(`/api/elevenlabs/call/${callingItem.conversation_id}`, { method: 'DELETE' })
                      }
                      // Only update status field to avoid column errors
                      const { error } = await (supabase
                        .from('call_queue') as any)
                        .update({ status: 'cancelled' })
                        .eq('id', callingItem.id)
                      
                      if (error) {
                        console.error('Error updating queue item:', error)
                        setCallStatus(`Error: ${error.message}`)
                      } else {
                        setCallStatus('Call ended')
                      }
                      loadQueue()
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg transition font-medium"
              >
                <PhoneOff className="w-4 h-4" />
                End Call
              </button>
            </div>
          </div>
        )}

        {/* Call Status */}
        {!activeCall && (isCalling || callStatus) && (
          <div className={`px-4 py-3 border-b border-white/5 ${
            isCalling ? 'bg-green-500/10' : 'bg-white/5'
          }`}>
            <div className="flex items-center gap-2">
              {isCalling && <Loader2 className="w-4 h-4 text-green-400 animate-spin" />}
              <span className="text-sm text-white/80">{callStatus}</span>
            </div>
            {isCalling && (
              <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  {completedCalls} completed
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-400" />
                  {failedCalls} failed
                </span>
              </div>
            )}
          </div>
        )}

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="text-center text-white/50 py-8">Loading queue...</div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/50">No numbers in queue</p>
              <p className="text-sm text-white/30 mt-1">Select leads in NorCRM and click "Add to Call Queue"</p>
            </div>
          ) : (
            queue.map((item, index) => (
              <CallQueueItem
                key={item.id}
                item={item}
                index={index}
                onRemove={() => removeFromQueue(item.id)}
                isCurrentCall={currentCallIndex === index}
              />
            ))
          )}
        </div>

        {/* Footer Controls */}
        {queue.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-navy-800 space-y-3">
            {/* Stats */}
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Est. time:</span>
              <span className="text-white">{Math.ceil(queuedCount * 2)} - {Math.ceil(queuedCount * 3)} min</span>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              {!isCalling ? (
                <>
                  <button
                    onClick={clearQueue}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                  <button
                    onClick={startCalling}
                    disabled={!selectedAgentId || queuedCount === 0}
                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
                  >
                    <Play className="w-4 h-4" />
                    Start AI Calling
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={isPaused ? resumeCalling : pauseCalling}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={stopCalling}
                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Stop Calling
                  </button>
                </>
              )}
            </div>

            {/* Schedule option */}
            {!isCalling && (
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white/50 hover:text-white transition">
                <Clock className="w-4 h-4" />
                Schedule for later
              </button>
            )}
          </div>
        )}
      </div>

      {/* Call History Panel */}
      <CallHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        agentId={selectedAgentId}
        agentName={agents.find(a => a.agent_id === selectedAgentId)?.name}
      />
    </>
  )
}
