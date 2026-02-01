'use client'

import { useState } from 'react'
import { ChevronDown, Shield, User, Check } from 'lucide-react'
import { useCurrentView, setCurrentView, ViewMode } from '@/hooks/useCurrentView'

export function ViewSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentView, isAdmin, loading } = useCurrentView()

  function switchView(view: ViewMode) {
    setCurrentView(view)
    setIsOpen(false)
  }

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="h-10 bg-navy-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  // If user can't access admin view, don't show switcher
  if (!isAdmin) {
    return null
  }

  return (
    <div className="relative px-3 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-navy-700 hover:bg-navy-700/80 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          {currentView === 'admin' ? (
            <Shield className="w-4 h-4 text-norv" />
          ) : (
            <User className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-white">
            {currentView === 'admin' ? 'Admin View' : 'Agent View'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute left-3 right-3 mt-1 bg-navy-700 border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => switchView('admin')}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-norv" />
                <span className="text-sm text-white">Admin View</span>
              </div>
              {currentView === 'admin' && (
                <Check className="w-4 h-4 text-norv" />
              )}
            </button>
            <button
              onClick={() => switchView('agent')}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">Agent View</span>
              </div>
              {currentView === 'agent' && (
                <Check className="w-4 h-4 text-norv" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
