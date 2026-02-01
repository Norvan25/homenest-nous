'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Plus, Mail, FileText, MessageCircle, Trash2, Copy, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Template {
  id: string
  type: 'email' | 'letter' | 'sms'
  name: string
  scenario: string
  content: string
  created_at: string
}

const typeIcons = {
  email: Mail,
  letter: FileText,
  sms: MessageCircle,
}

const typeColors = {
  email: 'bg-blue-500/20 text-blue-400',
  letter: 'bg-purple-500/20 text-purple-400',
  sms: 'bg-green-500/20 text-green-400',
}

export default function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const { data } = await (supabase.from('generated_documents') as any)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setTemplates(data)
    } catch (error) {
      console.log('Templates not available yet')
      // Mock data for demo
      setTemplates([
        {
          id: '1',
          type: 'email',
          name: 'Follow-up After Showing',
          scenario: 'follow-up-showing',
          content: 'Dear [Name],\n\nThank you for taking the time to view the property at...',
          created_at: '2026-01-28',
        },
        {
          id: '2',
          type: 'sms',
          name: 'Appointment Reminder',
          scenario: 'appointment-reminder',
          content: 'Hi [Name], just confirming our meeting tomorrow at 2pm...',
          created_at: '2026-01-27',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await (supabase.from('generated_documents') as any).delete().eq('id', id)
      setTemplates(templates.filter(t => t.id !== id))
      if (selectedTemplate?.id === id) setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || template.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link
          href="/nordosc"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-2"
        >
          <ArrowLeft size={16} />
          Back to NorDOSC
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Template Library</h1>
            <p className="text-white/60">Your saved templates and documents</p>
          </div>
          <Link
            href="/nordosc/email-writer"
            className="flex items-center gap-2 bg-norv text-white px-4 py-2 rounded-lg font-medium hover:bg-norv/80"
          >
            <Plus size={18} />
            Create New
          </Link>
        </div>
      </div>

      <div className="p-6">
        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-navy-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'email', 'letter', 'sms'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterType === type
                    ? 'bg-norv text-white'
                    : 'bg-navy-800 text-white/60 hover:bg-white/5'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Template List */}
          <div className="col-span-5">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-white/40">Loading...</div>
              ) : filteredTemplates.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {filteredTemplates.map((template) => {
                    const Icon = typeIcons[template.type]
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                          selectedTemplate?.id === template.id ? 'bg-white/5 border-l-2 border-norv' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-1.5 rounded ${typeColors[template.type]}`}>
                            <Icon size={14} />
                          </div>
                          <span className="font-medium">{template.name}</span>
                        </div>
                        <div className="text-sm text-white/50 truncate">{template.content}</div>
                        <div className="text-xs text-white/30 mt-2">
                          {new Date(template.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-white/40">
                  No templates found
                </div>
              )}
            </div>
          </div>

          {/* Right: Template Details */}
          <div className="col-span-7">
            {selectedTemplate ? (
              <div className="bg-navy-800/50 rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = typeIcons[selectedTemplate.type]
                      return (
                        <div className={`p-2 rounded ${typeColors[selectedTemplate.type]}`}>
                          <Icon size={20} />
                        </div>
                      )
                    })()}
                    <div>
                      <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>
                      <p className="text-sm text-white/50 capitalize">{selectedTemplate.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedTemplate.content)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                      title="Copy"
                    >
                      <Copy size={16} />
                    </button>
                    <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteTemplate(selectedTemplate.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-navy-900 rounded-lg p-4 whitespace-pre-wrap text-sm min-h-[300px]">
                  {selectedTemplate.content}
                </div>

                <div className="mt-4 text-sm text-white/40">
                  Created: {new Date(selectedTemplate.created_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="bg-navy-800/50 rounded-xl border border-white/10 p-6 h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center text-white/40">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a template to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
