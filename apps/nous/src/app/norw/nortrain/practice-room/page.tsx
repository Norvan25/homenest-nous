'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Mic, MicOff, Phone, PhoneOff, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Persona {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  icon: string
}

interface Session {
  id: string
  persona_id: string
  persona_name: string
  score: number
  created_at: string
}

const personas: Persona[] = [
  {
    id: 'skeptic',
    name: 'The Skeptic',
    description: 'Questions everything, needs proof',
    difficulty: 'hard',
    icon: '🤨',
  },
  {
    id: 'burned',
    name: 'The Burned',
    description: 'Bad past experience with agents',
    difficulty: 'hard',
    icon: '😤',
  },
  {
    id: 'cheapskate',
    name: 'The Cheapskate',
    description: 'Focused on costs and fees',
    difficulty: 'medium',
    icon: '💰',
  },
  {
    id: 'delusional',
    name: 'The Delusional',
    description: 'Unrealistic price expectations',
    difficulty: 'hard',
    icon: '⭐',
  },
  {
    id: 'procrastinator',
    name: 'The Procrastinator',
    description: 'Avoids making decisions',
    difficulty: 'medium',
    icon: '🐢',
  },
  {
    id: 'friendly',
    name: 'The Friendly',
    description: 'Easy conversation, confidence builder',
    difficulty: 'easy',
    icon: '😊',
  },
]

const difficultyColors = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-amber-500/20 text-amber-400',
  hard: 'bg-red-500/20 text-red-400',
}

const difficultyBars = {
  easy: 2,
  medium: 3,
  hard: 4,
}

export default function PracticeRoomPage() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchRecentSessions()
  }, [])

  const fetchRecentSessions = async () => {
    try {
      const { data } = await (supabase.from('practice_sessions') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) setRecentSessions(data)
    } catch (error) {
      console.log('Practice sessions not available yet')
    }
  }

  const startCall = async () => {
    if (!selectedPersona) return
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/norw/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: selectedPersona.id }),
      })
      
      if (response.ok) {
        setIsCallActive(true)
        // Connect to ElevenLabs WebSocket
      }
    } catch (error) {
      console.error('Failed to start practice call:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const endCall = async () => {
    setIsCallActive(false)
    fetchRecentSessions()
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link
          href="/norw/nortrain"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-2"
        >
          <ArrowLeft size={16} />
          Back to NorTrain
        </Link>
        <h1 className="text-2xl font-semibold">Practice Room</h1>
        <p className="text-white/60">Train your communication skills with AI personas</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Persona Selection */}
          <div className="col-span-5 space-y-4">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="font-medium mb-4">Select Persona</h2>
              <div className="space-y-2">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedPersona?.id === persona.id
                        ? 'border-gold-500 bg-gold-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl">{persona.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{persona.name}</div>
                      <div className="text-sm text-white/50">{persona.description}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-4 rounded-full ${
                            i < difficultyBars[persona.difficulty]
                              ? persona.difficulty === 'easy'
                                ? 'bg-green-500'
                                : persona.difficulty === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                              : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Call Interface */}
          <div className="col-span-7">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-6">
              {selectedPersona ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">{selectedPersona.icon}</div>
                  <h3 className="text-xl font-semibold mb-1">{selectedPersona.name}</h3>
                  <div className={`inline-block px-2 py-0.5 rounded text-xs ${difficultyColors[selectedPersona.difficulty]}`}>
                    {selectedPersona.difficulty.charAt(0).toUpperCase() + selectedPersona.difficulty.slice(1)}
                  </div>
                  <p className="text-white/50 mt-2 mb-6">{selectedPersona.description}</p>

                  {isCallActive ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-4 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
                        >
                          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        <button
                          onClick={endCall}
                          className="p-4 rounded-full bg-red-500 text-white"
                        >
                          <PhoneOff size={24} />
                        </button>
                      </div>
                      <div className="text-sm text-white/50">Call in progress...</div>
                    </div>
                  ) : (
                    <button
                      onClick={startCall}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 bg-gold-500 text-navy-900 px-6 py-3 rounded-lg font-medium hover:bg-gold-400 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <Phone size={20} />
                      )}
                      Start Practice Call
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-white/40">
                  <Mic size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a persona to begin</p>
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4 mt-4">
              <h3 className="font-medium mb-3">Recent Sessions</h3>
              {recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    >
                      <div>
                        <div className="font-medium">{session.persona_name}</div>
                        <div className="text-sm text-white/50">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-semibold ${
                          session.score >= 80 ? 'text-green-400' :
                          session.score >= 60 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {session.score}
                        </div>
                        <button className="text-sm text-gold-500 hover:underline">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">No practice sessions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
