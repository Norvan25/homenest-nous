'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Search, 
  Building2, 
  Megaphone, 
  BookOpen, 
  Zap,
  ChevronDown,
  ChevronRight,
  Lock,
  Settings,
  HelpCircle,
  Users
} from 'lucide-react'

// Norvan Axes with tools
const axes = [
  {
    id: 'norx',
    name: 'NorX',
    label: 'Insight',
    color: 'bg-norx',
    icon: Search,
    tools: [
      { name: 'NorLead', path: '/norlead', active: true, description: 'Find & filter leads' },
      { name: 'NorScan', path: '/norscan', active: false, description: 'Market scanner' },
      { name: 'NorSense', path: '/norsense', active: false, description: 'Pattern detection' },
      { name: 'NorAudit', path: '/noraudit', active: false, description: 'Health scoring' },
    ]
  },
  {
    id: 'nory',
    name: 'NorY',
    label: 'Architecture',
    color: 'bg-nory',
    icon: Building2,
    tools: [
      { name: 'NorMap', path: '/normap', active: false, description: 'Workflow blueprints' },
      { name: 'NorFlow', path: '/norflow', active: false, description: 'Automation builder' },
    ]
  },
  {
    id: 'norz',
    name: 'NorZ',
    label: 'Expression',
    color: 'bg-norz',
    icon: Megaphone,
    tools: [
      { name: 'NorVoice', path: '/norvoice', active: false, description: '11Labs AI calls' },
      { name: 'NorCast', path: '/norcast', active: false, description: 'Email campaigns' },
      { name: 'NorGen', path: '/norgen', active: false, description: 'Content generator' },
    ]
  },
  {
    id: 'norw',
    name: 'NorW',
    label: 'Knowledge',
    color: 'bg-norw',
    icon: BookOpen,
    tools: [
      { name: 'NorTrain', path: '/nortrain', active: false, description: 'Script builder' },
      { name: 'NorGuide', path: '/norguide', active: false, description: 'Documentation' },
    ]
  },
  {
    id: 'norv',
    name: 'NorV',
    label: 'Execution',
    color: 'bg-norv',
    icon: Zap,
    tools: [
      { name: 'NorCRM', path: '/norcrm', active: false, description: 'Lead management' },
      { name: 'NorBot', path: '/norbot', active: false, description: '24/7 chat assistant' },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedAxis, setExpandedAxis] = useState<string | null>('norx')

  const toggleAxis = (axisId: string) => {
    setExpandedAxis(expandedAxis === axisId ? null : axisId)
  }

  return (
    <aside className="w-64 bg-navy-800 border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold-500 rounded flex items-center justify-center">
            <span className="text-navy-900 font-bold text-sm">HN</span>
          </div>
          <div>
            <div className="font-semibold text-white">HomeNest</div>
            <div className="text-xs text-white/50">Nous</div>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="p-2">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            pathname === '/' 
              ? 'bg-gold-500/20 text-gold-500' 
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="font-medium">Dashboard</span>
        </Link>
      </div>

      {/* Axes Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="text-xs text-white/40 uppercase tracking-wider px-3 py-2">
          Tools
        </div>
        
        {axes.map((axis) => (
          <div key={axis.id} className="mb-1">
            {/* Axis Header */}
            <button
              onClick={() => toggleAxis(axis.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${axis.color}`} />
              <axis.icon size={18} />
              <span className="flex-1 text-left font-medium">{axis.name}</span>
              <span className="text-xs text-white/40">{axis.label}</span>
              {expandedAxis === axis.id ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>

            {/* Tools */}
            {expandedAxis === axis.id && (
              <div className="ml-5 pl-4 border-l border-white/10">
                {axis.tools.map((tool) => (
                  <Link
                    key={tool.path}
                    href={tool.active ? tool.path : '#'}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname === tool.path
                        ? 'bg-gold-500/20 text-gold-500'
                        : tool.active
                        ? 'text-white/70 hover:bg-white/5 hover:text-white'
                        : 'text-white/30 cursor-not-allowed'
                    }`}
                    onClick={(e) => !tool.active && e.preventDefault()}
                  >
                    {!tool.active && <Lock size={12} />}
                    <span>{tool.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white/70 transition-colors"
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white/70 transition-colors"
        >
          <HelpCircle size={18} />
          <span>Help</span>
        </Link>
      </div>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold-500/20 rounded-full flex items-center justify-center">
            <span className="text-gold-500 font-medium text-sm">SS</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Suzanna</div>
            <div className="text-xs text-white/40">Agent</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
