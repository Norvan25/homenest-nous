'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'

interface Option {
  value: string
  label: string
  count: number
}

interface Props {
  options: Option[]
  selected: string[]
  onToggle: (value: string) => void
  placeholder: string
}

export function FilterDropdown({ options, selected, onToggle, placeholder }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const clearAll = () => {
    selected.forEach(s => onToggle(s))
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
          isOpen 
            ? 'bg-navy-900 border-norx/50' 
            : 'bg-navy-900 border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {selected.length === 0 ? (
            <span className="text-white/40">{placeholder}</span>
          ) : (
            <>
              {selected.slice(0, 3).map(s => (
                <span
                  key={s}
                  className="bg-norx/20 text-norx text-sm px-2 py-0.5 rounded-lg flex items-center gap-1"
                >
                  {s}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(s)
                    }}
                    className="hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selected.length > 3 && (
                <span className="text-white/50 text-sm">+{selected.length - 3} more</span>
              )}
            </>
          )}
        </div>
        <ChevronDown 
          size={18} 
          className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-navy-800 border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-navy-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-norx/50"
                autoFocus
              />
            </div>
          </div>

          {/* Selected count & Clear */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm text-white/50">
                {selected.length} selected
              </span>
              <button
                onClick={clearAll}
                className="text-sm text-norx hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-white/40">No results</div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onToggle(option.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors ${
                    selected.includes(option.value) ? 'bg-norx/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      selected.includes(option.value)
                        ? 'bg-norx border-norx'
                        : 'border-white/20'
                    }`}>
                      {selected.includes(option.value) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    <span className="text-white">{option.label}</span>
                  </div>
                  <span className="text-white/40 text-sm">({option.count})</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
