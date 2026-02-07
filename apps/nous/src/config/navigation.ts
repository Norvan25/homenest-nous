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
  iconPath?: string   // Custom branded icon path in /icons/{section}/{key}.svg
  adminHref?: string
  adminOnly?: boolean
  agentOnly?: boolean
  featureKey?: string
  superAdminOnly?: boolean  // Restrict to super_admin role only
}

export interface NavSection {
  key: string
  label: string       // Full label e.g. "NorX — Insight"
  axisPrefix: string   // "Nor" (always white)
  axisLetter: string   // "X", "V", "W" etc. (colored)
  axisSubtitle: string // "Insight", "Execution", etc.
  color: string
  items: NavItem[]
}

// Agent View Navigation
export const agentNavigation: NavSection[] = [
  {
    key: 'norx',
    label: 'NorX — Insight',
    axisPrefix: 'Nor',
    axisLetter: 'X',
    axisSubtitle: 'Insight',
    color: '#007FFF',
    items: [
      { key: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard, iconPath: '/icons/norx/dashboard.svg', featureKey: 'norx.dashboard' },
      { key: 'norlead', label: 'NorLead', href: '/norlead', icon: Search, iconPath: '/icons/norx/norlead.svg', featureKey: 'norx.norlead' },
    ]
  },
  {
    key: 'norv',
    label: 'NorV — Execution',
    axisPrefix: 'Nor',
    axisLetter: 'V',
    axisSubtitle: 'Execution',
    color: '#00A6FB',
    items: [
      { key: 'call-workspace', label: 'Call Workspace', href: '/call-workspace', icon: Phone, iconPath: '/icons/norv/call-workspace.svg', featureKey: 'norv.call_workspace' },
      { key: 'email-workspace', label: 'Email Workspace', href: '/email-workspace', icon: Mail, iconPath: '/icons/norv/email-workspace.svg', featureKey: 'norv.email_workspace' },
      { key: 'norcrm', label: 'NorCRM', href: '/norcrm', icon: Users, iconPath: '/icons/norv/norcrm.svg', featureKey: 'norv.norcrm' },
      { key: 'email-writer', label: 'Email Writer', href: '/nordosc/email-writer', icon: Mail, iconPath: '/icons/norv/email-writer.svg', featureKey: 'nordosc.email_writer' },
      { key: 'letter-writer', label: 'Letter Writer', href: '/nordosc/letter-writer', icon: FileText, iconPath: '/icons/norv/letter-writer.svg', featureKey: 'nordosc.letter_writer' },
      { key: 'sms-writer', label: 'SMS Writer', href: '/nordosc/sms-writer', icon: MessageSquare, iconPath: '/icons/norv/sms-writer.svg', featureKey: 'nordosc.sms_writer' },
      { key: 'templates', label: 'Templates', href: '/nordosc/template-library', icon: Library, iconPath: '/icons/norv/templates.svg', featureKey: 'nordosc.template_library' },
    ]
  },
  {
    key: 'norw',
    label: 'NorW — Knowledge',
    axisPrefix: 'Nor',
    axisLetter: 'W',
    axisSubtitle: 'Knowledge',
    color: '#009E60',
    items: [
      { key: 'practice-room', label: 'Practice Room', href: '/norw/nortrain/practice-room', icon: GraduationCap, iconPath: '/icons/norw/practice-room.svg', featureKey: 'norw.practice_room' },
      { key: 'agent-lab', label: 'Agent Lab', href: '/norw/nortrain/agent-lab', icon: FlaskConical, iconPath: '/icons/norw/agent-lab.svg', featureKey: 'norw.agent_lab' },
      { key: 'call-analyzer', label: 'Call Analyzer', href: '/norw/norcoach/call-analyzer', icon: PhoneIncoming, iconPath: '/icons/norw/call-analyzer.svg', featureKey: 'norw.call_analyzer' },
      { key: 'script-library', label: 'Script Library', href: '/norw/norguide/script-library', icon: ScrollText, iconPath: '/icons/norw/script-library.svg', featureKey: 'norw.script_library' },
      { key: 'scenario-bank', label: 'Scenario Bank', href: '/norw/norguide/scenario-bank', icon: FolderOpen, iconPath: '/icons/norw/scenario-bank.svg', featureKey: 'norw.scenario_bank' },
    ]
  },
]

// Admin View Navigation (shows setup/config pages)
export const adminNavigation: NavSection[] = [
  {
    key: 'norx',
    label: 'NorX — Insight',
    axisPrefix: 'Nor',
    axisLetter: 'X',
    axisSubtitle: 'Insight',
    color: '#007FFF',
    items: [
      { key: 'dashboard-setup', label: 'Dashboard Setup', href: '/admin/setup/norx/dashboard', icon: LayoutDashboard, iconPath: '/icons/norx/dashboard.svg' },
    ]
  },
  {
    key: 'norv',
    label: 'NorV — Execution',
    axisPrefix: 'Nor',
    axisLetter: 'V',
    axisSubtitle: 'Execution',
    color: '#00A6FB',
    items: [
      { key: 'call-workspace-setup', label: 'Call Workspace Setup', href: '/admin/setup/norv/call-workspace', icon: Phone, iconPath: '/icons/norv/call-workspace.svg' },
      { key: 'norcrm-setup', label: 'NorCRM Setup', href: '/admin/setup/norv/norcrm', icon: Users, iconPath: '/icons/norv/norcrm.svg' },
      { key: 'nordosc-setup', label: 'NorDOSC Setup', href: '/admin/setup/norv/nordosc', icon: Mail, iconPath: '/icons/norv/email-writer.svg' },
    ]
  },
  {
    key: 'norw',
    label: 'NorW — Knowledge',
    axisPrefix: 'Nor',
    axisLetter: 'W',
    axisSubtitle: 'Knowledge',
    color: '#009E60',
    items: [
      { key: 'nortrain-setup', label: 'NorTrain Setup', href: '/admin/setup/norw/nortrain', icon: GraduationCap, iconPath: '/icons/norw/practice-room.svg' },
      { key: 'norcoach-setup', label: 'NorCoach Setup', href: '/admin/setup/norw/norcoach', icon: PhoneIncoming, iconPath: '/icons/norw/call-analyzer.svg' },
      { key: 'norguide-setup', label: 'NorGuide Setup', href: '/admin/setup/norw/norguide', icon: ScrollText, iconPath: '/icons/norw/script-library.svg' },
    ]
  },
  {
    key: 'system',
    label: 'System',
    axisPrefix: '',
    axisLetter: '',
    axisSubtitle: 'System',
    color: '#8E9AAF',
    items: [
      { key: 'ai-agents', label: 'AI Agents', href: '/admin/agents', icon: Bot, iconPath: '/icons/system/ai-agents.svg', superAdminOnly: true },
      { key: 'users', label: 'Users & Permissions', href: '/admin/users', icon: UserCog, iconPath: '/icons/system/users.svg' },
      { key: 'logs', label: 'Logs', href: '/admin/logs', icon: ClipboardList, iconPath: '/icons/system/logs.svg' },
      { key: 'settings', label: 'System Settings', href: '/admin/settings', icon: Settings, iconPath: '/icons/system/settings.svg' },
      { key: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: Activity, iconPath: '/icons/system/analytics.svg' },
    ]
  },
]
