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
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from 'lucide-react'
import { ViewSwitcher } from './ViewSwitcher'
import { useRouter } from 'next/navigation'
import { useCurrentView } from '@/hooks/useCurrentView'
import { agentNavigation, adminNavigation, NavSection, NavItem } from '@/config/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { createBrowserClient } from '@supabase/ssr'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentView, isAdmin, loading, userName, userRole } = useCurrentView()
  const { sidebarStyle, setSidebarStyle } = useTheme()
  const isCollapsed = sidebarStyle === 'collapsed'
  const [expandedSections, setExpandedSections] = useState<string[]>(['norx', 'norv', 'norw', 'system'])
  const [pinnedItems, setPinnedItems] = useState<string[]>([])
  const [loggingOut, setLoggingOut] = useState(false)

  // Create supabase client for auth
  const supabaseAuth = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogout() {
    setLoggingOut(true)
    try {
      // Clear stored role/view preferences
      localStorage.removeItem('homenest_current_view')
      localStorage.removeItem('homenest_user_role')
      
      await supabaseAuth.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoggingOut(false)
    }
  }

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
      <aside className={cn(
        "sidebar-container bg-navy-800 border-r border-white/10 flex flex-col h-screen transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4">
          <div className="h-8 bg-navy-700 rounded animate-pulse" />
        </div>
      </aside>
    )
  }

  return (
    <aside className={cn(
      "sidebar-container bg-navy-800 border-r border-white/10 flex flex-col h-screen transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn("border-b border-white/10", isCollapsed ? "p-2" : "p-4")}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-navy-900 font-bold text-sm">HN</span>
          </div>
          {!isCollapsed && (
            <div className="sidebar-logo-text">
              <div className="font-semibold text-white">HomeNest</div>
              <div className="text-xs text-white/50">Nous</div>
            </div>
          )}
        </Link>
      </div>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setSidebarStyle(isCollapsed ? 'expanded' : 'collapsed')}
        className={cn(
          "p-2 hover:bg-white/5 transition-colors",
          isCollapsed ? "mx-auto my-2" : "absolute top-4 right-2"
        )}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <PanelLeft className="w-4 h-4 text-white/40 hover:text-white" />
        ) : (
          <PanelLeftClose className="w-4 h-4 text-white/40 hover:text-white" />
        )}
      </button>

      {/* View Switcher */}
      {isAdmin && !isCollapsed && <ViewSwitcher />}

      {/* View Indicator */}
      {!isCollapsed && (
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
      )}

      {/* Quick Access (Pinned) - Agent View Only */}
      {pinnedItemsData.length > 0 && currentView === 'agent' && (
        <div className={cn("border-b border-white/10", isCollapsed ? "px-1 py-2" : "px-3 py-2")}>
          {!isCollapsed && (
            <div className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 px-2 sidebar-section-title">
              Quick Access
            </div>
          )}
          {pinnedItemsData.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center rounded-md text-sm transition-colors",
                isCollapsed ? "justify-center p-2" : "gap-2 px-2 py-1.5",
                pathname === item.href
                  ? 'bg-norv/20 text-norv'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map(section => (
          <div key={section.key} className="mb-2">
            {isCollapsed ? (
              // Collapsed: Just show a colored dot as section indicator
              <div className="flex justify-center py-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: section.color }}
                  title={section.label}
                />
              </div>
            ) : (
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider hover:text-white/60 sidebar-section-title"
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
            )}

            {(isCollapsed || expandedSections.includes(section.key)) && (
              <div className={cn("mt-1 space-y-0.5", isCollapsed ? "px-1" : "px-2")}>
                {section.items.map(item => (
                  <div key={item.key} className="group flex items-center">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex-1 flex items-center rounded-md text-sm transition-colors",
                        isCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2",
                        pathname === item.href
                          ? 'bg-norv/20 text-norv'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
                    </Link>
                    
                    {/* Pin button (agent view only, expanded only) */}
                    {currentView === 'agent' && !isCollapsed && (
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
      <div className={cn("border-t border-white/10", isCollapsed ? "p-2" : "p-3")}>
        {/* Settings - only show admin settings for admins */}
        {isAdmin && (
          <Link
            href="/admin/settings"
            className={cn(
              "flex items-center rounded-lg text-sm text-white/60 hover:bg-white/5 transition-colors",
              isCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2"
            )}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="sidebar-label">Settings</span>}
          </Link>
        )}
        <Link
          href="/help"
          className={cn(
            "flex items-center rounded-lg text-sm text-white/60 hover:bg-white/5 transition-colors",
            isCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2"
          )}
          title={isCollapsed ? 'Help & Support' : undefined}
        >
          <HelpCircle size={18} className="flex-shrink-0" />
          {!isCollapsed && <span className="sidebar-label">Help & Support</span>}
        </Link>

        {/* User */}
        <div className={cn(
          "mt-3 flex items-center",
          isCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2"
        )}>
          <div className="w-8 h-8 bg-norv/20 rounded-full flex items-center justify-center text-norv text-sm font-medium flex-shrink-0">
            {userName ? userName.slice(0, 2).toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <div className="sidebar-label flex-1">
              <div className="text-sm text-white">{userName || 'User'}</div>
              <div className="text-xs text-white/40 capitalize">{userRole.replace('_', ' ')}</div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            "flex items-center rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors mt-2",
            isCollapsed ? "justify-center p-2 w-full" : "gap-2 px-3 py-2 w-full"
          )}
          title={isCollapsed ? 'Logout' : undefined}
        >
          {loggingOut ? (
            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <LogOut size={18} className="flex-shrink-0" />
          )}
          {!isCollapsed && <span className="sidebar-label">{loggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>
      </div>
    </aside>
  )
}
