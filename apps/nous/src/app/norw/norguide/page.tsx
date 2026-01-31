'use client'

import Link from 'next/link'
import { FileText, Target, ArrowRight } from 'lucide-react'

const tools = [
  {
    id: 'script-library',
    name: 'Script Library',
    description: 'Browse and create call scripts for different scenarios. Build winning conversations.',
    icon: FileText,
    href: '/norw/norguide/script-library',
    color: 'bg-norw/20 text-norw',
  },
  {
    id: 'scenario-bank',
    name: 'Scenario Bank',
    description: 'Pre-built conversation scenarios for practice. Various difficulty levels and personas.',
    icon: Target,
    href: '/norw/norguide/scenario-bank',
    color: 'bg-norw/20 text-norw',
  },
]

export default function NorGuidePage() {
  return (
    <div className="min-h-screen bg-navy-900">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-norw" />
          <h1 className="text-2xl font-semibold text-white">NorGuide</h1>
        </div>
        <p className="text-white/60">Scripts, scenarios, and resources to guide your conversations</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group bg-navy-800/50 border border-white/10 rounded-xl p-6 hover:border-norw/50 transition-colors"
            >
              <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-4`}>
                <tool.icon size={24} />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-norw transition-colors">
                {tool.name}
              </h2>
              <p className="text-white/60 text-sm mb-4">{tool.description}</p>
              <div className="flex items-center gap-2 text-norw text-sm font-medium">
                <span>Get Started</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
