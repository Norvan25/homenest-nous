'use client'

import Link from 'next/link'
import { ArrowLeft, Bug, LogIn, MessageCircle, Activity } from 'lucide-react'

const logTypes = [
  { key: 'debug', label: 'Debug Logs', icon: Bug, href: '/admin/logs/debug', description: 'Application errors and debug info' },
  { key: 'login', label: 'Login Logs', icon: LogIn, href: '/admin/logs/logins', description: 'User authentication events' },
  { key: 'conversations', label: 'Conversation Logs', icon: MessageCircle, href: '/admin/logs/conversations', description: 'AI agent conversations' },
  { key: 'api', label: 'API Logs', icon: Activity, href: '/admin/logs/api', description: 'External API calls' },
]

export default function LogsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">System Logs</h1>
          <p className="text-white/60 mt-1">Monitor system activity and troubleshoot issues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {logTypes.map(log => (
          <Link
            key={log.key}
            href={log.href}
            className="bg-navy-800/50 border border-white/10 rounded-lg p-6 hover:border-norv/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-navy-700 rounded-lg flex items-center justify-center">
                <log.icon className="w-6 h-6 text-norv" />
              </div>
              <div>
                <h3 className="font-medium text-white">{log.label}</h3>
                <p className="text-sm text-white/50">{log.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
