'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { Conversation } from '@11labs/client';
import { TranscriptViewer } from '../shared/TranscriptViewer';

interface PracticeCallProps {
  config: {
    scenarioId: string;
    scenarioName: string;
    personaId: string;
    personaName: string;
    difficulty: number;
    agentId: string;
    agentName: string;
  };
  onEnd: (transcript: any[], duration: number, conversationId?: string) => void;
}

interface TranscriptEntry {
  role: 'agent' | 'homeowner';
  message: string;
  timestamp: number;
}

export function PracticeCall({ config, onEnd }: PracticeCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [duration, setDuration] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'homeowner' | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const conversationRef = useRef<Conversation | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  // Keep transcript ref in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
    
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (conversationRef.current) {
      try {
        conversationRef.current.endSession();
      } catch (e) {
        console.log('Conversation cleanup');
      }
      conversationRef.current = null;
    }
  }, []);

  const initializeConversation = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // 1. Get signed URL from our API
      const response = await fetch('/api/norw/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: config.agentId,
          scenarioId: config.scenarioId,
          personaId: config.personaId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start practice session');
      }

      setConversationId(data.conversationId);

      // 2. Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. Start ElevenLabs conversation
      const conversation = await Conversation.startSession({
        signedUrl: data.signedUrl,
        onConnect: () => {
          console.log('Connected to ElevenLabs');
          setIsConnecting(false);
          setIsConnected(true);
          startTimer();
        },
        onDisconnect: () => {
          console.log('Disconnected from ElevenLabs');
          setIsConnected(false);
        },
        onMessage: (message) => {
          handleMessage(message);
        },
        onError: (err) => {
          console.error('ElevenLabs error:', err);
          setError(typeof err === 'string' ? err : 'Connection error');
        },
        onModeChange: (mode) => {
          if (mode.mode === 'speaking') {
            setCurrentSpeaker('agent');
          } else if (mode.mode === 'listening') {
            setCurrentSpeaker('homeowner');
          } else {
            setCurrentSpeaker(null);
          }
        },
      });

      conversationRef.current = conversation;

    } catch (err) {
      console.error('Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start practice session');
      setIsConnecting(false);
    }
  };

  const handleMessage = (message: any) => {
    const timestamp = Math.floor((Date.now() - startTimeRef.current) / 1000);
    console.log('ElevenLabs message:', message);

    // Handle different message formats
    if (message.type === 'transcript' || message.type === 'final_transcript') {
      const isAgent = message.role === 'agent' || message.role === 'assistant';
      const text = message.text || message.message;
      if (text) {
        addToTranscript(isAgent ? 'agent' : 'homeowner', text, timestamp);
      }
    } else if (message.type === 'agent_response' && message.text) {
      addToTranscript('agent', message.text, timestamp);
    } else if (message.type === 'user_transcript' && message.text) {
      addToTranscript('homeowner', message.text, timestamp);
    }
  };

  const addToTranscript = (role: 'agent' | 'homeowner', message: string, timestamp: number) => {
    setTranscript(prev => {
      // Avoid duplicate entries
      const lastEntry = prev[prev.length - 1];
      if (lastEntry?.message === message && lastEntry?.role === role) {
        return prev;
      }
      return [...prev, { role, message, timestamp }];
    });
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const handleEndCall = useCallback(() => {
    const finalTranscript = transcriptRef.current;
    const finalDuration = duration;
    const finalConversationId = conversationId;
    
    cleanup();
    onEnd(finalTranscript, finalDuration, finalConversationId || undefined);
  }, [duration, conversationId, cleanup, onEnd]);

  const toggleMute = async () => {
    if (conversationRef.current) {
      try {
        if (isMuted) {
          await conversationRef.current.setVolume({ volume: 1 });
        } else {
          await conversationRef.current.setVolume({ volume: 0 });
        }
        setIsMuted(!isMuted);
      } catch (e) {
        console.error('Mute toggle error:', e);
      }
    }
  };

  const retryConnection = () => {
    setError(null);
    setIsConnecting(true);
    setTranscript([]);
    initializeConversation();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Error state
  if (error && !isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-navy-800 border border-red-500/30 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={retryConnection}
              className="w-full px-6 py-3 bg-cyan-500 text-navy-900 rounded-xl font-medium hover:bg-cyan-400"
            >
              Try Again
            </button>
            <button
              onClick={() => onEnd([], 0)}
              className="w-full px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-navy-800 border border-white/10 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connecting to AI Agent...</h2>
          <p className="text-white/60">Setting up your practice session with {config.agentName}</p>
          <p className="text-white/40 text-sm mt-4">Please allow microphone access when prompted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
        {/* Call Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-navy-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="text-white font-medium">{config.scenarioName}</div>
                <div className="text-white/40 text-sm">
                  Agent: {config.agentName} • Persona: {config.personaName}
                </div>
              </div>
            </div>
            <div className="text-2xl font-mono text-white">{formatDuration(duration)}</div>
          </div>
        </div>

        {/* Transcript Area */}
        <div className="h-[400px] overflow-y-auto">
          <TranscriptViewer transcript={transcript} isLive />
        </div>

        {/* Speaking Indicator */}
        <div className="px-6 py-3 border-t border-white/10 bg-navy-900/50">
          <div className="flex items-center justify-center gap-2">
            {currentSpeaker === 'agent' ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-cyan-400 text-sm">AI is speaking...</span>
              </>
            ) : currentSpeaker === 'homeowner' ? (
              <>
                <Mic className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-green-400 text-sm">You are speaking...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-white/40" />
                <span className="text-white/40 text-sm">
                  {isMuted ? 'Microphone muted' : 'Listening... speak now'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
        <p className="text-cyan-400 text-sm">
          <strong>Tip:</strong> Speak naturally. The AI agent will respond to your voice in real-time. 
          Try to achieve all your objectives before ending the call.
        </p>
      </div>
    </div>
  );
}
