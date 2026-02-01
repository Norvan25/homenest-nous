import {
  LayoutDashboard, Phone, Users, Mail, FileText, MessageSquare,
  Library, GraduationCap, FlaskConical, PhoneIncoming, ScrollText,
  FolderOpen, Bot, ClipboardList, Settings, Activity, UserCog,
  Shield, Bug, LogIn, MessageCircle, Search, Zap
} from 'lucide-react'

export interface NavItem {
  key: string
  label: string
  href: string
  icon: any
  adminHref?: string
  adminOnly?: boolean
  agentOnly?: boolean
  featureKey?: string
}

export interface NavSection {
  key: string
  label: string
  color: string
  items: NavItem[]
}

// Agent View Navigation
export const agentNavigation: NavSection[] = [
  {
    key: 'norx',
    label: 'NorX — Insight',
    color: '#007FFF',
    items: [
      { key: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard, featureKey: 'norx.dashboard' },
      { key: 'norlead', label: 'NorLead', href: '/norlead', icon: Search, featureKey: 'norx.norlead' },
    ]
  },
  {
    key: 'norv',
    label: 'NorV — Execution',
    color: '#00A6FB',
    items: [
      { key: 'call-workspace', label: 'Call Workspace', href: '/call-workspace', icon: Phone, featureKey: 'norv.call_workspace' },
      { key: 'norcrm', label: 'NorCRM', href: '/norcrm', icon: Users, featureKey: 'norv.norcrm' },
      { key: 'email-writer', label: 'Email Writer', href: '/nordosc/email-writer', icon: Mail, featureKey: 'nordosc.email_writer' },
      { key: 'letter-writer', label: 'Letter Writer', href: '/nordosc/letter-writer', icon: FileText, featureKey: 'nordosc.letter_writer' },
      { key: 'sms-writer', label: 'SMS Writer', href: '/nordosc/sms-writer', icon: MessageSquare, featureKey: 'nordosc.sms_writer' },
      { key: 'templates', label: 'Templates', href: '/nordosc/template-library', icon: Library, featureKey: 'nordosc.template_library' },
    ]
  },
  {
    key: 'norw',
    label: 'NorW — Knowledge',
    color: '#009E60',
    items: [
      { key: 'practice-room', label: 'Practice Room', href: '/norw/nortrain/practice-room', icon: GraduationCap, featureKey: 'norw.practice_room' },
      { key: 'agent-lab', label: 'Agent Lab', href: '/norw/nortrain/agent-lab', icon: FlaskConical, featureKey: 'norw.agent_lab' },
      { key: 'call-analyzer', label: 'Call Analyzer', href: '/norw/norcoach/call-analyzer', icon: PhoneIncoming, featureKey: 'norw.call_analyzer' },
      { key: 'script-library', label: 'Script Library', href: '/norw/norguide/script-library', icon: ScrollText, featureKey: 'norw.script_library' },
      { key: 'scenario-bank', label: 'Scenario Bank', href: '/norw/norguide/scenario-bank', icon: FolderOpen, featureKey: 'norw.scenario_bank' },
    ]
  },
]

// Admin View Navigation (shows setup/config pages)
export const adminNavigation: NavSection[] = [
  {
    key: 'norx',
    label: 'NorX — Insight',
    color: '#007FFF',
    items: [
      { key: 'dashboard-setup', label: 'Dashboard Setup', href: '/admin/setup/norx/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    key: 'norv',
    label: 'NorV — Execution',
    color: '#00A6FB',
    items: [
      { key: 'call-workspace-setup', label: 'Call Workspace Setup', href: '/admin/setup/norv/call-workspace', icon: Phone },
      { key: 'norcrm-setup', label: 'NorCRM Setup', href: '/admin/setup/norv/norcrm', icon: Users },
      { key: 'nordosc-setup', label: 'NorDOSC Setup', href: '/admin/setup/norv/nordosc', icon: Mail },
    ]
  },
  {
    key: 'norw',
    label: 'NorW — Knowledge',
    color: '#009E60',
    items: [
      { key: 'nortrain-setup', label: 'NorTrain Setup', href: '/admin/setup/norw/nortrain', icon: GraduationCap },
      { key: 'norcoach-setup', label: 'NorCoach Setup', href: '/admin/setup/norw/norcoach', icon: PhoneIncoming },
      { key: 'norguide-setup', label: 'NorGuide Setup', href: '/admin/setup/norw/norguide', icon: ScrollText },
    ]
  },
  {
    key: 'system',
    label: 'System',
    color: '#8E9AAF',
    items: [
      { key: 'ai-agents', label: 'AI Agents', href: '/admin/agents', icon: Bot },
      { key: 'users', label: 'Users & Permissions', href: '/admin/users', icon: UserCog },
      { key: 'logs', label: 'Logs', href: '/admin/logs', icon: ClipboardList },
      { key: 'settings', label: 'System Settings', href: '/admin/settings', icon: Settings },
      { key: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: Activity },
    ]
  },
]
