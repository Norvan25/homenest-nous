'use client'

import Link from 'next/link'
import { Mail, FileText, MessageCircle, Library, ArrowRight } from 'lucide-react'

const tools = [
  {
    id: 'email-writer',
    name: 'Email Writer',
    description: 'AI-powered email generation with your voice and style. Perfect for follow-ups, introductions, and negotiations.',
    icon: Mail,
    href: '/nordosc/email-writer',
    color: 'bg-norv/20 text-norv',
  },
  {
    id: 'letter-writer',
    name: 'Letter Writer',
    description: 'Generate professional letters for sellers, buyers, and partners. Formal correspondence made easy.',
    icon: FileText,
    href: '/nordosc/letter-writer',
    color: 'bg-norv/20 text-norv',
  },
  {
    id: 'sms-writer',
    name: 'SMS Writer',
    description: 'Quick, effective text messages that get responses. Short-form communication optimized.',
    icon: MessageCircle,
    href: '/nordosc/sms-writer',
    color: 'bg-norv/20 text-norv',
  },
  {
    id: 'template-library',
    name: 'Template Library',
    description: 'Save and organize your best performing templates. Build your personal communication arsenal.',
    icon: Library,
    href: '/nordosc/template-library',
    color: 'bg-norv/20 text-norv',
  },
]

export default function NorDOSCPage() {
  return (
    <div className="min-h-screen bg-navy-900">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-norv" />
          <h1 className="text-2xl font-semibold text-white">NorDOSC</h1>
        </div>
        <p className="text-white/60">Document & Communication Generation Suite</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group bg-navy-800/50 border border-white/10 rounded-xl p-6 hover:border-norv/50 transition-colors"
            >
              <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-4`}>
                <tool.icon size={24} />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-norv transition-colors">
                {tool.name}
              </h2>
              <p className="text-white/60 text-sm mb-4">{tool.description}</p>
              <div className="flex items-center gap-2 text-norv text-sm font-medium">
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
