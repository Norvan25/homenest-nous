'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  Pin,
  PinOff,
  HelpCircle,
  Settings,
  X,
} from 'lucide-react'
import { ViewSwitcher } from './ViewSwitcher'
import { useCurrentView } from '@/hooks/useCurrentView'
import { agentNavigation, adminNavigation, NavSection, NavItem } from '@/config/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const pathname = usePathname()
  const { currentView, isAdmin, loading } = useCurrentView()
  const [expandedSections, setExpandedSections] = useState<string[]>(['norx', 'norv', 'norw', 'system'])
  const [pinnedItems, setPinnedItems] = useState<string[]>([])

  // Load pinned items
  useEffect(() => {
    loadPinnedItems()
  }, [currentView])

  async function loadPinnedItems() {
    try {
      const { data } = await (supabase.from('user_sidebar_pins') as any)
        .select('tool_path, tool_label, tool_icon')
        .order('position')
      
      if (data) {
        setPinnedItems(data.map((p: any) => p.tool_path))
      }
    } catch (error) {
      // Table might not exist yet
    }
  }

  async function togglePin(item: NavItem) {
    const isPinned = pinnedItems.includes(item.href)
    
    if (isPinned) {
      try {
        await (supabase.from('user_sidebar_pins') as any)
          .delete()
          .eq('tool_path', item.href)
        setPinnedItems(prev => prev.filter(k => k !== item.href))
      } catch (error) {
        console.error('Error removing pin:', error)
      }
    } else {
      if (pinnedItems.length >= 3) {
        alert('Maximum 3 pinned items allowed')
        return
      }
      try {
        await (supabase.from('user_sidebar_pins') as any)
          .insert({
            tool_path: item.href,
            tool_label: item.label,
            tool_icon: item.key,
            position: pinnedItems.length
          })
        setPinnedItems(prev => [...prev, item.href])
      } catch (error) {
        console.error('Error adding pin:', error)
      }
    }
  }

  function toggleSection(sectionKey: string) {
    setExpandedSections(prev =>
      prev.includes(sectionKey)
        ? prev.filter(k => k !== sectionKey)
        : [...prev, sectionKey]
    )
  }

  // Select navigation based on view
  const navigation = currentView === 'admin' ? adminNavigation : agentNavigation

  // Get all items for pinning
  const allItems = navigation.flatMap(section => section.items)

  // Get pinned items data
  const pinnedItemsData = pinnedItems
    .map(href => allItems.find(item => item.href === href))
    .filter(Boolean) as NavItem[]

  if (loading) {
    return (
      <aside className="w-64 bg-navy-800 border-r border-white/10 flex flex-col h-screen">
        <div className="p-4">
          <div className="h-8 bg-navy-700 rounded animate-pulse" />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-navy-800 border-r border-white/10 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
            <span className="text-navy-900 font-bold text-sm">HN</span>
          </div>
          <div>
            <div className="font-semibold text-white">HomeNest</div>
            <div className="text-xs text-white/50">Nous</div>
          </div>
        </Link>
      </div>

      {/* View Switcher */}
      {isAdmin && <ViewSwitcher />}

      {/* View Indicator */}
      <div className="px-4 py-2">
        <div className={cn(
          "text-xs font-medium px-2 py-1 rounded",
          currentView === 'admin' 
            ? 'bg-norv/20 text-norv' 
            : 'bg-white/10 text-white/60'
        )}>
          {currentView === 'admin' ? '⚙️ Setup & Configure' : '👤 Tools & Features'}
        </div>
      </div>

      {/* Quick Access (Pinned) - Agent View Only */}
      {pinnedItemsData.length > 0 && currentView === 'agent' && (
        <div className="px-3 py-2 border-b border-white/10">
          <div className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 px-2">
            Quick Access
          </div>
          {pinnedItemsData.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                pathname === item.href
                  ? 'bg-norv/20 text-norv'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map(section => (
          <div key={section.key} className="mb-2">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider hover:text-white/60"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: section.color }}
                />
                <span>{section.label}</span>
              </div>
              <ChevronDown 
                className={cn(
                  "w-4 h-4 transition-transform",
                  expandedSections.includes(section.key) ? '' : '-rotate-90'
                )}
              />
            </button>

            {expandedSections.includes(section.key) && (
              <div className="mt-1 space-y-0.5 px-2">
                {section.items.map(item => (
                  <div key={item.key} className="group flex items-center">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        pathname === item.href
                          ? 'bg-norv/20 text-norv'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                    
                    {/* Pin button (agent view only) */}
                    {currentView === 'agent' && (
                      <button
                        onClick={() => togglePin(item)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                        title={pinnedItems.includes(item.href) ? 'Unpin' : 'Pin to Quick Access'}
                      >
                        {pinnedItems.includes(item.href) ? (
                          <PinOff className="w-3 h-3 text-norv" />
                        ) : (
                          <Pin className="w-3 h-3 text-white/40" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5"
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5"
        >
          <HelpCircle size={18} />
          <span>Help & Support</span>
        </Link>

        {/* User */}
        <div className="mt-3 flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 bg-norv/20 rounded-full flex items-center justify-center text-norv text-sm font-medium">
            SS
          </div>
          <div>
            <div className="text-sm text-white">Suzanna</div>
            <div className="text-xs text-white/40">Agent</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
