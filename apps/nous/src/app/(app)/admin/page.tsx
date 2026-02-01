'use client'

import Link from 'next/link'
import { Bot, Users, ClipboardList, Settings, Activity, Shield, Mail, Phone, GraduationCap } from 'lucide-react'

const quickActions = [
  { label: 'AI Agents', href: '/admin/agents', icon: Bot, description: 'Manage AI voice and chat agents', color: 'bg-norv/20 text-norv' },
  { label: 'Users', href: '/admin/users', icon: Users, description: 'Manage users and permissions', color: 'bg-purple-500/20 text-purple-400' },
  { label: 'Logs', href: '/admin/logs', icon: ClipboardList, description: 'View system and conversation logs', color: 'bg-amber-500/20 text-amber-400' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'Configure system settings', color: 'bg-gray-500/20 text-gray-400' },
]

const setupSections = [
  { label: 'Call Workspace', href: '/admin/setup/norv/call-workspace', icon: Phone, axis: 'NorV' },
  { label: 'NorDOSC', href: '/admin/setup/norv/nordosc', icon: Mail, axis: 'NorV' },
  { label: 'NorTrain', href: '/admin/setup/norw/nortrain', icon: GraduationCap, axis: 'NorW' },
]

export default function AdminDashboard() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-norv" />
          <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
        </div>
        <p className="text-white/60">Configure and manage HomeNest Nous platform</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Link
              key={action.label}
              href={action.href}
              className="bg-navy-800/50 border border-white/10 rounded-xl p-5 hover:border-norv/50 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-white mb-1 group-hover:text-norv transition-colors">
                {action.label}
              </h3>
              <p className="text-sm text-white/50">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Tool Setup */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Tool Configuration</h2>
        <div className="bg-navy-800/50 border border-white/10 rounded-xl overflow-hidden">
          {setupSections.map((section, i) => (
            <Link
              key={section.label}
              href={section.href}
              className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${
                i !== setupSections.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <div className="font-medium text-white">{section.label}</div>
                  <div className="text-sm text-white/40">{section.axis}</div>
                </div>
              </div>
              <span className="text-white/40">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Preview */}
      <div>
        <h2 className="text-lg font-medium text-white mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-navy-800/50 border border-white/10 rounded-xl p-5">
            <div className="text-3xl font-semibold text-white mb-1">3</div>
            <div className="text-sm text-white/50">Active AI Agents</div>
          </div>
          <div className="bg-navy-800/50 border border-white/10 rounded-xl p-5">
            <div className="text-3xl font-semibold text-white mb-1">1</div>
            <div className="text-sm text-white/50">Active Users</div>
          </div>
          <div className="bg-navy-800/50 border border-white/10 rounded-xl p-5">
            <div className="text-3xl font-semibold text-white mb-1">24</div>
            <div className="text-sm text-white/50">API Calls Today</div>
          </div>
        </div>
      </div>
    </div>
  )
}
