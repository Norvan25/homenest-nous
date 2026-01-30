'use client'

import { useRef, useEffect, useState } from 'react'
import { X, Sparkles, Maximize2, Minimize2 } from 'lucide-react'
import { useAssistant } from '@/hooks/useAssistant'
import AssistantMessage from './AssistantMessage'
import AssistantInput from './AssistantInput'

interface Props {
  onClose: () => void
}

export default function AssistantPanel({ onClose }: Props) {
  const { messages, isLoading, sendMessage, submitFeedback } = useAssistant()
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={`
      fixed z-50 bg-navy-900 border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden
      transition-all duration-300 ease-out
      ${isExpanded 
        ? 'bottom-6 right-6 w-[600px] h-[700px]' 
        : 'bottom-24 right-6 w-96 h-[500px]'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-navy-800 to-navy-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-semibold text-white text-sm">Nous Assistant</span>
            <span className="block text-xs text-cyan-400/70 font-light">Ready to help</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-cyan-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-400/70" />
            </div>
            <p className="text-sm font-light text-white/70">Hi! I'm your Nous assistant.</p>
            <p className="text-sm font-light text-white/50 mt-1">Ask me anything about using the system.</p>
            
            <div className="mt-6 space-y-2 max-w-[280px] mx-auto">
              <SuggestionChip onClick={() => sendMessage('How do I add leads to CRM?')}>
                How do I add leads to CRM?
              </SuggestionChip>
              <SuggestionChip onClick={() => sendMessage('What does DNC mean?')}>
                What does DNC mean?
              </SuggestionChip>
              <SuggestionChip onClick={() => sendMessage('How do I log a call?')}>
                How do I log a call?
              </SuggestionChip>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <AssistantMessage
            key={message.id}
            message={message}
            onFeedback={submitFeedback}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
            <span className="text-xs font-light text-white/40">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <AssistantInput onSend={sendMessage} isLoading={isLoading} />
      
      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/5 bg-navy-950">
        <p className="text-[10px] text-white/30 text-center font-light">
          Powered by Claude • Press Enter to send
        </p>
      </div>
    </div>
  )
}

function SuggestionChip({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left text-xs font-light px-3 py-2.5 bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-lg text-white/60 hover:text-white transition-all"
    >
      {children}
    </button>
  )
}
