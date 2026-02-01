'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, Phone, MessageSquare, FileText, Users } from 'lucide-react'

export default function AnalyticsPage() {
  const stats = [
    { label: 'Total Calls', value: '1,234', change: '+12%', icon: Phone },
    { label: 'Documents Generated', value: '567', change: '+23%', icon: FileText },
    { label: 'Chat Sessions', value: '890', change: '+8%', icon: MessageSquare },
    { label: 'Active Users', value: '12', change: '+2', icon: Users },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
          <p className="text-white/60 text-sm">Platform usage and performance metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-navy-800/50 border border-white/10 rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5 text-white/50" />
              <span className="text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Call Volume</h3>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <p className="text-white/40">Chart coming soon</p>
          </div>
        </div>

        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Document Generation</h3>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <p className="text-white/40">Chart coming soon</p>
          </div>
        </div>

        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">User Activity</h3>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <p className="text-white/40">Chart coming soon</p>
          </div>
        </div>

        <div className="bg-navy-800/50 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">AI Agent Performance</h3>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <p className="text-white/40">Chart coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
