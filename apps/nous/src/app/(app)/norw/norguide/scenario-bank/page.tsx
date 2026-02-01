'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Target, Play } from 'lucide-react'
import Link from 'next/link'

interface Scenario {
  id: string
  name: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  persona: string
  objectives: string[]
}

const mockScenarios: Scenario[] = [
  {
    id: '1',
    name: 'Expired Listing - First Contact',
    category: 'Expired',
    difficulty: 'medium',
    description: 'First call to a homeowner whose listing just expired',
    persona: 'Frustrated seller who feels their agent failed them',
    objectives: ['Build rapport', 'Identify pain points', 'Schedule meeting'],
  },
  {
    id: '2',
    name: 'FSBO - Commission Objection',
    category: 'FSBO',
    difficulty: 'hard',
    description: 'FSBO seller pushes back on paying commission',
    persona: 'Cost-conscious homeowner who wants to save money',
    objectives: ['Demonstrate value', 'Overcome commission objection', 'Get appointment'],
  },
  {
    id: '3',
    name: 'Price Reduction Conversation',
    category: 'Listing',
    difficulty: 'hard',
    description: 'Seller needs to reduce price after 60 days',
    persona: 'Emotionally attached homeowner with unrealistic expectations',
    objectives: ['Present market data', 'Maintain relationship', 'Get price reduction'],
  },
  {
    id: '4',
    name: 'Warm Referral Follow-up',
    category: 'Referral',
    difficulty: 'easy',
    description: 'Following up on a warm referral from past client',
    persona: 'Receptive prospect who trusts the referral source',
    objectives: ['Introduce yourself', 'Qualify the lead', 'Schedule consultation'],
  },
]

const categories = ['All', 'Expired', 'FSBO', 'Listing', 'Referral']

const difficultyColors = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-amber-500/20 text-amber-400',
  hard: 'bg-red-500/20 text-red-400',
}

export default function ScenarioBankPage() {
  const [scenarios] = useState<Scenario[]>(mockScenarios)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = scenario.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || scenario.category === selectedCategory
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
        <h1 className="text-2xl font-semibold">Scenario Bank</h1>
        <p className="text-white/60">Pre-built scenarios for practice and training</p>
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
              placeholder="Search scenarios..."
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

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-navy-800/50 rounded-xl border border-white/10 p-5 hover:border-norw/50 transition-colors cursor-pointer"
              onClick={() => setSelectedScenario(scenario)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{scenario.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${difficultyColors[scenario.difficulty]}`}>
                  {scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
                </span>
              </div>
              
              <h3 className="font-semibold mb-2">{scenario.name}</h3>
              <p className="text-sm text-white/60 mb-4">{scenario.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/40">
                  <Target size={12} className="inline mr-1" />
                  {scenario.objectives.length} objectives
                </div>
                <Link
                  href={`/norw/nortrain/practice-room?scenario=${scenario.id}`}
                  className="flex items-center gap-1 text-norw text-sm hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Play size={14} />
                  Practice
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Scenario Detail Modal */}
        {selectedScenario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedScenario(null)}>
            <div className="bg-navy-800 rounded-xl border border-white/10 p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-2 py-0.5 rounded ${difficultyColors[selectedScenario.difficulty]}`}>
                  {selectedScenario.difficulty.charAt(0).toUpperCase() + selectedScenario.difficulty.slice(1)}
                </span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{selectedScenario.category}</span>
              </div>
              
              <h2 className="text-xl font-semibold mb-2">{selectedScenario.name}</h2>
              <p className="text-white/60 mb-4">{selectedScenario.description}</p>
              
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="text-sm text-white/40 mb-2">Persona</div>
                <p className="text-sm">{selectedScenario.persona}</p>
              </div>
              
              <div className="mb-6">
                <div className="text-sm text-white/40 mb-2">Objectives</div>
                <ul className="space-y-2">
                  {selectedScenario.objectives.map((obj, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Target size={14} className="text-norw" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedScenario(null)}
                  className="flex-1 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                >
                  Close
                </button>
                <Link
                  href={`/norw/nortrain/practice-room?scenario=${selectedScenario.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-norw text-white px-4 py-2 rounded-lg hover:bg-norw/80"
                >
                  <Play size={16} />
                  Start Practice
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
