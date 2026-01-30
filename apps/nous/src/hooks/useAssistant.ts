'use client'

import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export function useAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => uuidv4())

  const sendMessage = useCallback(async (content: string) => {
    // Add user message immediately
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId,
          history: messages.slice(-10), // Last 10 messages for context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: Message = {
        id: data.chatId || uuidv4(),
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Assistant error:', error)
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again in a moment.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [messages, sessionId])

  const submitFeedback = useCallback(async (chatId: string, helpful: boolean) => {
    try {
      await fetch('/api/assistant/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, helpful }),
      })
    } catch (error) {
      console.error('Feedback error:', error)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    submitFeedback,
    clearMessages,
    sessionId,
  }
}
