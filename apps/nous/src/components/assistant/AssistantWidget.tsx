'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import AssistantPanel from './AssistantPanel'

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      >
        {isOpen ? (
          <div className="w-12 h-12 bg-navy-800 border border-white/20 rounded-full flex items-center justify-center shadow-lg hover:border-cyan-500/50 transition-all">
            <X className="w-5 h-5 text-white/70" />
          </div>
        ) : (
          <div className="relative">
            {/* Pulse animation */}
            <div className="absolute inset-0 w-14 h-14 bg-cyan-500/30 rounded-full animate-ping opacity-75" />
            <div className="absolute inset-0 w-14 h-14 bg-cyan-500/20 rounded-full animate-pulse" />
            
            {/* Main button */}
            <div className="relative w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-110 transition-all duration-200">
              <Sparkles className="w-6 h-6 text-navy-900" />
            </div>
            
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-navy-800 border border-white/10 rounded-lg text-xs text-white font-light opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
              Nous Assistant
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-800" />
            </div>
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <AssistantPanel onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
