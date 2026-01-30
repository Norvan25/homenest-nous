'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, ChevronDown } from 'lucide-react'

interface Props {
  selectedCount: number
  onAddToQueue: (queueNumber: number) => void
  disabled?: boolean
}

export default function CallQueueButton({ selectedCount, onAddToQueue, disabled }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleQueueSelect = (queueNumber: number) => {
    onAddToQueue(queueNumber)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || selectedCount === 0}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg transition"
      >
        <Phone className="w-4 h-4" />
        <span>Add to Queue</span>
        {selectedCount > 0 && (
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{selectedCount}</span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-navy-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => handleQueueSelect(num)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-white hover:bg-green-500/20 transition-colors"
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                num === 1 ? 'bg-cyan-500/20 text-cyan-400' :
                num === 2 ? 'bg-purple-500/20 text-purple-400' :
                num === 3 ? 'bg-amber-500/20 text-amber-400' :
                'bg-pink-500/20 text-pink-400'
              }`}>
                Q{num}
              </div>
              <span>Queue {num}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
