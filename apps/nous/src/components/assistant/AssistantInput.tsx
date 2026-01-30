'use client'

import { useState, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface Props {
  onSend: (message: string) => void
  isLoading: boolean
}

export default function AssistantInput({ onSend, isLoading }: Props) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-3 border-t border-white/5 bg-navy-800/50">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={isLoading}
          className="flex-1 bg-navy-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-light placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:cursor-not-allowed text-navy-900 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:hover:scale-100"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
