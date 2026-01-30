'use client';

import { useEffect, useRef } from 'react';
import { User, Home } from 'lucide-react';

interface TranscriptEntry {
  role: 'agent' | 'homeowner';
  message: string;
  timestamp: number;
}

interface TranscriptViewerProps {
  transcript: TranscriptEntry[];
  isLive?: boolean;
  highlightIndex?: number;
}

export function TranscriptViewer({ transcript, isLive, highlightIndex }: TranscriptViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isLive]);

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={scrollRef} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
      {transcript.length === 0 ? (
        <div className="text-center text-white/40 py-12">
          <p>Waiting for conversation to start...</p>
        </div>
      ) : (
        transcript.map((entry, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              highlightIndex === index ? 'bg-cyan-500/10 -mx-3 px-3 py-2 rounded-lg' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              entry.role === 'agent' 
                ? 'bg-cyan-500/20 text-cyan-400' 
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {entry.role === 'agent' ? <User size={16} /> : <Home size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium ${
                  entry.role === 'agent' ? 'text-cyan-400' : 'text-amber-400'
                }`}>
                  {entry.role === 'agent' ? 'Agent' : 'Homeowner'}
                </span>
                <span className="text-xs text-white/30">{formatTimestamp(entry.timestamp)}</span>
              </div>
              <p className="text-white/80 leading-relaxed">{entry.message}</p>
            </div>
          </div>
        ))
      )}
      
      {isLive && (
        <div className="flex gap-3 items-center text-white/40">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
          </div>
          <span className="text-sm">Listening...</span>
        </div>
      )}
    </div>
  );
}
