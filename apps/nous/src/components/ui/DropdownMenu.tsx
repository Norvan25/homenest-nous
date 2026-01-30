'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'

interface MenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface DropdownMenuProps {
  items: MenuItem[]
  trigger?: ReactNode
  align?: 'left' | 'right'
}

export function DropdownMenu({ items, trigger, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
      >
        {trigger || <MoreVertical size={18} />}
      </button>

      {isOpen && (
        <div 
          className={`absolute z-50 mt-1 w-48 bg-navy-800 border border-white/20 rounded-xl shadow-xl overflow-hidden ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                if (!item.disabled) {
                  item.onClick()
                  setIsOpen(false)
                }
              }}
              disabled={item.disabled}
              className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : item.variant === 'danger'
                  ? 'text-red-400 hover:bg-red-500/20'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
