'use client'

import { useState } from 'react'
import { ArrowLeft, Zap, GitBranch, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface PromptVersion {
  id: string
  version: number
  name: string
  prompt: string
  metrics: {
    callsHandled: number
    avgScore: number
    conversionRate: number
  }
  created_at: string
}

const mockVersions: PromptVersion[] = [
  {
    id: '1',
    version: 3,
    name: 'Current Production',
    prompt: 'You are a professional real estate agent...',
    metrics: { callsHandled: 150, avgScore: 82, conversionRate: 18 },
    created_at: '2026-01-28',
  },
  {
    id: '2',
    version: 2,
    name: 'Previous Version',
    prompt: 'You are an experienced real estate consultant...',
    metrics: { callsHandled: 320, avgScore: 76, conversionRate: 15 },
    created_at: '2026-01-15',
  },
  {
    id: '3',
    version: 1,
    name: 'Initial Version',
    prompt: 'You are a real estate AI assistant...',
    metrics: { callsHandled: 200, avgScore: 68, conversionRate: 12 },
    created_at: '2026-01-01',
  },
]

export default function PromptEvolutionPage() {
  const [versions] = useState<PromptVersion[]>(mockVersions)
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(mockVersions[0])
  const [compareVersion, setCompareVersion] = useState<PromptVersion | null>(null)

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link
          href="/norw/norcoach"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-2"
        >
          <ArrowLeft size={16} />
          Back to NorCoach
        </Link>
        <h1 className="text-2xl font-semibold">Prompt Evolution</h1>
        <p className="text-white/60">Track and compare AI prompt versions</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Version List */}
          <div className="col-span-4">
            <div className="bg-navy-800/50 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-medium">Versions</h2>
                <button className="text-sm text-norw hover:underline">+ New Version</button>
              </div>
              
              <div className="divide-y divide-white/5">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                      selectedVersion?.id === version.id ? 'bg-white/5 border-l-2 border-norw' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch size={14} className="text-norw" />
                      <span className="font-medium">v{version.version}</span>
                      {version.version === 3 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white/60">{version.name}</div>
                    <div className="text-xs text-white/40 mt-1">{version.created_at}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Version Details */}
          <div className="col-span-8 space-y-4">
            {selectedVersion && (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
                    <div className="text-sm text-white/40 mb-1">Calls Handled</div>
                    <div className="text-2xl font-semibold">{selectedVersion.metrics.callsHandled}</div>
                  </div>
                  <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
                    <div className="text-sm text-white/40 mb-1">Avg Score</div>
                    <div className="text-2xl font-semibold flex items-center gap-2">
                      {selectedVersion.metrics.avgScore}
                      <TrendingUp size={18} className="text-green-400" />
                    </div>
                  </div>
                  <div className="bg-navy-800/50 rounded-xl border border-white/10 p-4">
                    <div className="text-sm text-white/40 mb-1">Conversion Rate</div>
                    <div className="text-2xl font-semibold">{selectedVersion.metrics.conversionRate}%</div>
                  </div>
                </div>

                {/* Prompt Content */}
                <div className="bg-navy-800/50 rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Prompt Content</h3>
                    <div className="flex gap-2">
                      <select
                        value={compareVersion?.id || ''}
                        onChange={(e) => setCompareVersion(versions.find(v => v.id === e.target.value) || null)}
                        className="bg-navy-700 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="">Compare with...</option>
                        {versions.filter(v => v.id !== selectedVersion.id).map((v) => (
                          <option key={v.id} value={v.id}>v{v.version} - {v.name}</option>
                        ))}
                      </select>
                      <button className="px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className={compareVersion ? 'grid grid-cols-2 gap-4' : ''}>
                    <div>
                      {compareVersion && <div className="text-xs text-white/40 mb-2">v{selectedVersion.version} (Current)</div>}
                      <div className="bg-navy-900 rounded-lg p-4 text-sm text-white/80 font-mono whitespace-pre-wrap">
                        {selectedVersion.prompt}
                      </div>
                    </div>
                    {compareVersion && (
                      <div>
                        <div className="text-xs text-white/40 mb-2">v{compareVersion.version}</div>
                        <div className="bg-navy-900 rounded-lg p-4 text-sm text-white/80 font-mono whitespace-pre-wrap">
                          {compareVersion.prompt}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
