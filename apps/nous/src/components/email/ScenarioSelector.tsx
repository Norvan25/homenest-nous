'use client'

import { ChevronLeft, ChevronRight, FileText, Users } from 'lucide-react'
import type { Scenario } from '@/app/(app)/email/page'

interface ScenarioSelectorProps {
  scenarios: Scenario[]
  selectedScenario: Scenario | null
  onSelect: (scenario: Scenario) => void
  selectedLeadCount: number
  onBack: () => void
  onNext: () => void
}

export default function ScenarioSelector({
  scenarios,
  selectedScenario,
  onSelect,
  selectedLeadCount,
  onBack,
  onNext
}: ScenarioSelectorProps) {
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-medium text-white mb-1">Select Scenario</h2>
        <p className="text-sm text-white/50">Choose which email template to use</p>
      </div>

      {/* Selected Count */}
      <div className="px-4 py-3 border-b border-white/10 bg-navy-900/50">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Users className="w-4 h-4" />
          <span>{selectedLeadCount} leads selected</span>
        </div>
      </div>

      {/* Scenarios List */}
      <div className="p-4 space-y-3">
        {scenarios.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/50">No email scenarios available</p>
            <p className="text-white/30 text-sm mt-1">Add scenarios in Admin → NorDOSC Setup</p>
          </div>
        ) : (
          scenarios.map(scenario => (
            <label
              key={scenario.id}
              className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                selectedScenario?.id === scenario.id
                  ? 'bg-norv/20 border-norv'
                  : 'bg-navy-900 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="scenario"
                  checked={selectedScenario?.id === scenario.id}
                  onChange={() => onSelect(scenario)}
                  className="mt-1 w-4 h-4 text-norv bg-navy-900 border-white/20 focus:ring-norv focus:ring-offset-0"
                />
                <div>
                  <div className="font-medium text-white mb-1">
                    {scenario.name}
                  </div>
                  <div className="text-sm text-white/50">
                    {scenario.description || 'No description'}
                  </div>
                  <div className="text-xs text-white/30 mt-2">
                    Key: {scenario.scenario_key}
                  </div>
                </div>
              </div>
            </label>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedScenario}
          className="flex items-center gap-2 px-4 py-2 bg-norv hover:bg-norv/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Review & Send
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}
