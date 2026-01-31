'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Phone,
  Search,
  Building2,
  MessageSquare,
  BookOpen,
  Zap,
  Settings,
  HelpCircle,
  Pin,
  X,
  ChevronRight,
  ChevronDown,
  Mic,
  Users,
  BarChart3,
  FileText,
  Mail,
  FileEdit,
  MessageCircle,
  Library,
  Target,
  Bot,
  GraduationCap,
  Lightbulb,
  Lock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface PinnedItem {
  id: string
  tool_path: string
  tool_label: string
  tool_icon: string
  position: number
}

interface NavItem {
  path: string
  label: string
  icon: string
  active?: boolean
  children?: NavItem[]
}

// Icon mapping
const iconMap: Record<string, any> = {
  'layout-dashboard': LayoutDashboard,
  'phone': Phone,
  'search': Search,
  'building-2': Building2,
  'message-square': MessageSquare,
  'book-open': BookOpen,
  'zap': Zap,
  'mic': Mic,
  'users': Users,
  'bar-chart-3': BarChart3,
  'file-text': FileText,
  'mail': Mail,
  'file-edit': FileEdit,
  'message-circle': MessageCircle,
  'library': Library,
  'target': Target,
  'bot': Bot,
  'graduation-cap': GraduationCap,
  'lightbulb': Lightbulb,
}

// Navigation structure with Norvan axis colors
const navigation = {
  norx: {
    label: 'NorX',
    sublabel: 'Insight',
    color: '#007FFF', // norx blue
    icon: 'search',
    children: [
      { path: '/norlead', label: 'NorLead', icon: 'search', active: true },
      { path: '/norscan', label: 'NorScan', icon: 'target', active: false },
      { path: '/norsense', label: 'NorSense', icon: 'lightbulb', active: false },
    ],
  },
  nory: {
    label: 'NorY',
    sublabel: 'Architecture',
    color: '#7F4FC9', // nory purple
    icon: 'building-2',
    children: [
      { path: '/normap', label: 'NorMap', icon: 'building-2', active: false },
      { path: '/norflow', label: 'NorFlow', icon: 'zap', active: false },
    ],
  },
  norz: {
    label: 'NorZ',
    sublabel: 'Expression',
    color: '#F28500', // norz orange
    icon: 'message-square',
    children: [
      { path: '/norvoice', label: 'NorVoice', icon: 'mic', active: false },
      { path: '/norcast', label: 'NorCast', icon: 'mail', active: false },
    ],
  },
  norw: {
    label: 'NorW',
    sublabel: 'Knowledge',
    color: '#009E60', // norw green
    icon: 'book-open',
    children: [
      {
        path: '/norw/nortrain',
        label: 'NorTrain',
        icon: 'graduation-cap',
        active: true,
        children: [
          { path: '/norw/nortrain/practice-room', label: 'Practice Room', icon: 'mic', active: true },
          { path: '/norw/nortrain/agent-lab', label: 'Agent Lab', icon: 'users', active: true },
        ],
      },
      {
        path: '/norw/norcoach',
        label: 'NorCoach',
        icon: 'lightbulb',
        active: true,
        children: [
          { path: '/norw/norcoach/call-analyzer', label: 'Call Analyzer', icon: 'bar-chart-3', active: true },
          { path: '/norw/norcoach/prompt-evolution', label: 'Prompt Evolution', icon: 'zap', active: true },
        ],
      },
      {
        path: '/norw/norguide',
        label: 'NorGuide',
        icon: 'book-open',
        active: true,
        children: [
          { path: '/norw/norguide/script-library', label: 'Script Library', icon: 'file-text', active: true },
          { path: '/norw/norguide/scenario-bank', label: 'Scenario Bank', icon: 'target', active: true },
        ],
      },
    ],
  },
  norv: {
    label: 'NorV',
    sublabel: 'Execution',
    color: '#00A6FB', // norv cyan
    icon: 'zap',
    children: [
      { path: '/norcrm', label: 'NorCRM', icon: 'users', active: true },
      { path: '/norbot', label: 'NorBot', icon: 'bot', active: false },
      {
        path: '/nordosc',
        label: 'NorDOSC',
        icon: 'file-edit',
        active: true,
        children: [
          { path: '/nordosc/email-writer', label: 'Email Writer', icon: 'mail', active: true },
          { path: '/nordosc/letter-writer', label: 'Letter Writer', icon: 'file-text', active: true },
          { path: '/nordosc/sms-writer', label: 'SMS Writer', icon: 'message-circle', active: true },
          { path: '/nordosc/template-library', label: 'Template Library', icon: 'library', active: true },
        ],
      },
    ],
  },
}

export default function Sidebar() {
  const pathname = usePathname()
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['norw', 'norv']))
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set())

  // Fetch pinned items
  useEffect(() => {
    fetchPinnedItems()
  }, [])

  const fetchPinnedItems = async () => {
    try {
      const { data } = await (supabase.from('user_sidebar_pins') as any)
        .select('*')
        .order('position')
      if (data) setPinnedItems(data)
    } catch (error) {
      // Table might not exist yet
      console.log('Sidebar pins not available yet')
    }
  }

  const pinItem = async (path: string, label: string, icon: string) => {
    if (pinnedItems.length >= 3) {
      alert('Max 3 shortcuts. Unpin one first.')
      return
    }
    const nextPosition = pinnedItems.length + 1
    try {
      const { error } = await (supabase.from('user_sidebar_pins') as any).insert({
        tool_path: path,
        tool_label: label,
        tool_icon: icon,
        position: nextPosition,
      })
      if (!error) fetchPinnedItems()
    } catch (error) {
      console.error('Failed to pin item:', error)
    }
  }

  const unpinItem = async (id: string) => {
    try {
      await (supabase.from('user_sidebar_pins') as any).delete().eq('id', id)
      fetchPinnedItems()
    } catch (error) {
      console.error('Failed to unpin item:', error)
    }
  }

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSubsection = (path: string) => {
    setExpandedSubsections(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || FileText
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

      {/* Quick Access (Pinned) */}
      <div className="p-3 border-b border-white/10">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Quick Access</div>
        
        {/* Default pins */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === '/' ? "bg-norv/20 text-norv" : "text-white/70 hover:bg-white/5"
          )}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
          <Pin size={12} className="ml-auto text-white/30" />
        </Link>
        
        <Link
          href="/call-workspace"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === '/call-workspace' ? "bg-green-500/20 text-green-400" : "text-white/70 hover:bg-white/5"
          )}
        >
          <Phone size={18} />
          <span>Call Workspace</span>
          <Pin size={12} className="ml-auto text-white/30" />
        </Link>

        {/* Divider if user has pins */}
        {pinnedItems.length > 0 && (
          <div className="border-t border-dashed border-white/10 my-2" />
        )}

        {/* User pinned items */}
        {pinnedItems.map((item) => {
          const IconComponent = getIcon(item.tool_icon)
          return (
            <div
              key={item.id}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === item.tool_path ? "bg-norv/20 text-norv" : "text-white/70 hover:bg-white/5"
              )}
            >
              <Link href={item.tool_path} className="flex items-center gap-2 flex-1">
                <IconComponent size={18} />
                <span>{item.tool_label}</span>
              </Link>
              <button
                onClick={() => unpinItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Tools Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Tools</div>

        {Object.entries(navigation).map(([key, section]) => (
          <div key={key} className="mb-1">
            {/* Section header */}
            <button
              onClick={() => toggleSection(key)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: section.color }}
              />
              <span className="font-medium">{section.label}</span>
              <span className="text-white/40 text-xs">{section.sublabel}</span>
              <ChevronRight
                size={14}
                className={cn(
                  "ml-auto transition-transform",
                  expandedSections.has(key) && "rotate-90"
                )}
              />
            </button>

            {/* Section children */}
            {expandedSections.has(key) && section.children.length > 0 && (
              <div className="ml-4 mt-1 space-y-1">
                {section.children.map((child: any) => (
                  <div key={child.path}>
                    {child.children ? (
                      // Subsection with children
                      <>
                        <button
                          onClick={() => toggleSubsection(child.path)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                            child.active ? "text-white/60 hover:bg-white/5" : "text-white/30 cursor-not-allowed"
                          )}
                          disabled={!child.active}
                        >
                          {!child.active && <Lock size={12} />}
                          {React.createElement(getIcon(child.icon), { size: 16 })}
                          <span>{child.label}</span>
                          {child.active && (
                            <ChevronDown
                              size={12}
                              className={cn(
                                "ml-auto transition-transform",
                                !expandedSubsections.has(child.path) && "-rotate-90"
                              )}
                            />
                          )}
                        </button>
                        {child.active && expandedSubsections.has(child.path) && (
                          <div className="ml-4 mt-1 space-y-1">
                            {child.children.map((subChild: NavItem) => (
                              <NavLink
                                key={subChild.path}
                                item={subChild}
                                pathname={pathname}
                                onPin={pinItem}
                                isPinned={pinnedItems.some(p => p.tool_path === subChild.path)}
                                getIcon={getIcon}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Direct link
                      <NavLink
                        item={child}
                        pathname={pathname}
                        onPin={pinItem}
                        isPinned={pinnedItems.some(p => p.tool_path === child.path)}
                        getIcon={getIcon}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

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
          <span>Help</span>
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

// NavLink component with pin functionality
function NavLink({
  item,
  pathname,
  onPin,
  isPinned,
  getIcon,
}: {
  item: NavItem
  pathname: string
  onPin: (path: string, label: string, icon: string) => void
  isPinned: boolean
  getIcon: (name: string) => any
}) {
  const IconComponent = getIcon(item.icon)
  const isActive = pathname === item.path
  const isDisabled = item.active === false

  if (isDisabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/30 cursor-not-allowed">
        <Lock size={12} />
        <IconComponent size={16} />
        <span>{item.label}</span>
      </div>
    )
  }

  return (
    <div className="group relative">
      <Link
        href={item.path}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
          isActive ? "bg-norv/20 text-norv" : "text-white/60 hover:bg-white/5"
        )}
      >
        <IconComponent size={16} />
        <span>{item.label}</span>
      </Link>
      {!isPinned && (
        <button
          onClick={(e) => {
            e.preventDefault()
            onPin(item.path, item.label, item.icon)
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-norv transition-opacity"
          title="Pin to Quick Access"
        >
          <Pin size={12} />
        </button>
      )}
    </div>
  )
}
