'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Flag, Check } from 'lucide-react'
import { nordoscLogger } from '@/lib/nordosc-logger'

interface GenerationFeedbackProps {
  generationId: string
  onFeedback?: (thumbs: 'up' | 'down') => void
}

export default function GenerationFeedback({ generationId, onFeedback }: GenerationFeedbackProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [showFlagInput, setShowFlagInput] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [flagged, setFlagged] = useState(false)

  async function handleFeedback(thumbs: 'up' | 'down') {
    setFeedback(thumbs)
    await nordoscLogger.logFeedback(generationId, thumbs)
    onFeedback?.(thumbs)
  }

  async function handleFlag() {
    if (!flagReason.trim()) return
    
    const success = await nordoscLogger.flagForReview(generationId, flagReason)
    if (success) {
      setFlagged(true)
      setShowFlagInput(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/50 mr-2">How was this?</span>
      
      <button
        onClick={() => handleFeedback('up')}
        className={`p-1.5 rounded transition-colors ${
          feedback === 'up'
            ? 'bg-green-500/20 text-green-400'
            : 'hover:bg-white/10 text-white/40 hover:text-white'
        }`}
        title="Good response"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => handleFeedback('down')}
        className={`p-1.5 rounded transition-colors ${
          feedback === 'down'
            ? 'bg-red-500/20 text-red-400'
            : 'hover:bg-white/10 text-white/40 hover:text-white'
        }`}
        title="Poor response"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {flagged ? (
        <span className="flex items-center gap-1 text-xs text-yellow-400">
          <Check className="w-3 h-3" /> Flagged
        </span>
      ) : showFlagInput ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="What's wrong?"
            className="px-2 py-1 text-xs bg-navy-900 border border-white/10 rounded text-white placeholder-white/30 w-40"
            autoFocus
          />
          <button
            onClick={handleFlag}
            className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30"
          >
            Submit
          </button>
          <button
            onClick={() => setShowFlagInput(false)}
            className="text-white/50 hover:text-white text-xs"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowFlagInput(true)}
          className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-yellow-400 transition-colors"
          title="Flag for review"
        >
          <Flag className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
