'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function NorGuideBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm NorGuide, your HomeNest assistant. How can I help you today?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/norguide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      })

      const data = await response.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I could not process that.' }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-norv text-white rounded-full shadow-lg flex items-center justify-center hover:bg-norv/80 transition-all z-50 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Open NorGuide assistant"
      >
        <HelpCircle size={24} />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-navy-800 rounded-2xl shadow-2xl border border-white/10 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-navy-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-norv/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={18} className="text-norv" />
                </div>
                <div>
                  <div className="font-medium text-white">NorGuide</div>
                  <div className="text-xs text-white/50">Your HomeNest assistant</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                      message.role === 'user'
                        ? 'bg-norv text-white rounded-br-md'
                        : 'bg-white/10 text-white rounded-bl-md'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <Loader2 size={16} className="animate-spin text-white/50" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['How do I add leads?', 'Call workspace help', 'What is NorW?'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                      sendMessage()
                    }}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/60 hover:bg-white/10 hover:text-white whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-navy-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything..."
                  className="flex-1 bg-white/10 border-0 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-norv"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-norv rounded-xl flex items-center justify-center text-white hover:bg-norv/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
