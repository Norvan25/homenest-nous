'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, User, Sparkles } from 'lucide-react'
import { Message } from '@/hooks/useAssistant'

interface Props {
  message: Message
  onFeedback: (chatId: string, helpful: boolean) => void
}

export default function AssistantMessage({ message, onFeedback }: Props) {
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null)
  const isUser = message.role === 'user'

  const handleFeedback = (helpful: boolean) => {
    if (feedbackGiven !== null) return
    setFeedbackGiven(helpful)
    onFeedback(message.id, helpful)
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-white/10' : 'bg-cyan-500/20'
      }`}>
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white/60" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`inline-block px-4 py-2.5 rounded-xl text-sm font-light leading-relaxed ${
          isUser
            ? 'bg-cyan-500 text-navy-900'
            : 'bg-white/5 text-white/90 border border-white/5'
        }`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Feedback buttons */}
        {!isUser && feedbackGiven === null && (
          <div className="flex gap-1 mt-1.5 ml-1">
            <span className="text-[10px] text-white/30 mr-1">Helpful?</span>
            <button
              onClick={() => handleFeedback(true)}
              className="text-white/20 hover:text-green-400 transition p-0.5"
              title="Yes"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="text-white/20 hover:text-red-400 transition p-0.5"
              title="No"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}

        {feedbackGiven !== null && (
          <div className="text-[10px] text-white/30 mt-1 ml-1 font-light">
            {feedbackGiven ? 'Thanks!' : "We'll improve."}
          </div>
        )}
      </div>
    </div>
  )
}
