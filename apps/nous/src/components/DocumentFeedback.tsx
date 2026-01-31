'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DocumentFeedbackProps {
  documentId: string | null
  onFeedback?: (feedback: 'positive' | 'negative') => void
}

export function DocumentFeedback({ documentId, onFeedback }: DocumentFeedbackProps) {
  const [submitted, setSubmitted] = useState<'positive' | 'negative' | null>(null)
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  const submitFeedback = async (feedback: 'positive' | 'negative') => {
    setSubmitted(feedback)
    
    if (documentId) {
      try {
        await (supabase
          .from('generated_documents') as any)
          .update({ 
            user_feedback: feedback,
            feedback_note: note || null
          })
          .eq('id', documentId)
      } catch (e) {
        // Table might not have feedback columns yet
        console.log('Feedback save failed:', e)
      }
    }

    onFeedback?.(feedback)
    
    if (feedback === 'negative' && !note) {
      setShowNote(true)
    }
  }

  const submitNote = async () => {
    if (documentId) {
      try {
        await (supabase
          .from('generated_documents') as any)
          .update({ feedback_note: note })
          .eq('id', documentId)
      } catch (e) {
        console.log('Note save failed:', e)
      }
    }
    
    setShowNote(false)
  }

  if (!documentId) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/40">Helpful?</span>
      
      <button
        onClick={() => submitFeedback('positive')}
        disabled={!!submitted}
        className={`p-2 rounded-lg transition-colors ${
          submitted === 'positive'
            ? 'bg-green-500/20 text-green-400'
            : submitted
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:bg-white/10 text-white/60'
        }`}
      >
        <ThumbsUp size={16} />
      </button>
      
      <button
        onClick={() => submitFeedback('negative')}
        disabled={!!submitted}
        className={`p-2 rounded-lg transition-colors ${
          submitted === 'negative'
            ? 'bg-red-500/20 text-red-400'
            : submitted
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:bg-white/10 text-white/60'
        }`}
      >
        <ThumbsDown size={16} />
      </button>

      {showNote && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was wrong?"
            className="bg-white/10 border-0 rounded px-2 py-1 text-sm text-white"
          />
          <button
            onClick={submitNote}
            className="text-sm text-norv hover:underline"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
