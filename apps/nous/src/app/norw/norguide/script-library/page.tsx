'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Plus, FileText, Copy, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Script {
  id: string
  name: string
  category: string
  description: string
  content: string
  tags: string[]
  created_at: string
}

const mockScripts: Script[] = [
  {
    id: '1',
    name: 'Expired Listing Opener',
    category: 'Cold Call',
    description: 'Opening script for expired listing calls',
    content: 'Hi [Name], this is [Agent] with HomeNest. I noticed your listing at [Address] recently expired...',
    tags: ['expired', 'opener'],
    created_at: '2026-01-20',
  },
  {
    id: '2',
    name: 'Commission Objection Handler',
    category: 'Objection',
    description: 'Handling commission-related objections',
    content: 'I completely understand your concern about commission. Let me share how our marketing investment...',
    tags: ['objection', 'commission'],
    created_at: '2026-01-18',
  },
  {
    id: '3',
    name: 'FSBO Approach',
    category: 'Cold Call',
    description: 'Approach script for For Sale By Owner properties',
    content: 'Hi [Name], I see you\'re selling your home on [Street]. Many homeowners start that way...',
    tags: ['fsbo', 'opener'],
    created_at: '2026-01-15',
  },
]

const categories = ['All', 'Cold Call', 'Objection', 'Follow-up', 'Closing']

export default function ScriptLibraryPage() {
  const [scripts] = useState<Script[]>(mockScripts)
  const [selectedScript, setSelectedScript] = useState<Script | null>(mockScripts[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || script.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link
          href="/norw/norguide"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-2"
        >
          <ArrowLeft size={16} />
          Back to NorGuide
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Script Library</h1>
            <p className="text-white/60">Browse and manage call scripts</p>
          </div>
          <button className="flex items-center gap-2 bg-gold-500 text-navy-900 px-4 py-2 rounded-lg font-medium hover:bg-gold-400">
            <Plus size={18} />
            New Script
          </button>
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
              placeholder="Search scripts..."
              className="w-full bg-navy-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-norw text-white'
                    : 'bg-navy-800 text-white/60 hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Script List */}
          <div className="col-span-5">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 overflow-hidden">
              <div className="divide-y divide-white/5">
                {filteredScripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => setSelectedScript(script)}
                    className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                      selectedScript?.id === script.id ? 'bg-white/5 border-l-2 border-norw' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={16} className="text-norw" />
                      <span className="font-medium">{script.name}</span>
                    </div>
                    <div className="text-sm text-white/60 mb-2">{script.description}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{script.category}</span>
                      {script.tags.map((tag) => (
                        <span key={tag} className="text-xs text-white/40">#{tag}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Script Details */}
          <div className="col-span-7">
            {selectedScript ? (
              <div className="bg-navy-800/50 rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedScript.name}</h2>
                    <p className="text-sm text-white/60">{selectedScript.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20" title="Copy">
                      <Copy size={16} />
                    </button>
                    <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-navy-900 rounded-lg p-4 mb-4">
                  <div className="text-sm text-white/40 mb-2">Script Content</div>
                  <div className="text-sm whitespace-pre-wrap">{selectedScript.content}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Tags:</span>
                  {selectedScript.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-norw/20 text-norw px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-navy-800/50 rounded-xl border border-white/10 p-6 h-full flex items-center justify-center">
                <div className="text-center text-white/40">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a script to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
