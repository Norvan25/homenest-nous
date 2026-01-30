'use client';

import { ArrowLeft, Play, Target, AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';
import { DifficultyBadge } from '../shared/DifficultyBadge';

interface ScenarioDetailProps {
  scenario: {
    id: string;
    name: string;
    category: string;
    description: string;
    difficulty: number;
    objectives: string[];
    commonMistakes: string[];
    personas: string[];
  };
  onBack: () => void;
}

export function ScenarioDetail({ scenario, onBack }: ScenarioDetailProps) {
  const getPersonaLabel = (type: string) => {
    const labels: Record<string, string> = {
      skeptic: 'The Skeptic',
      burned: 'The Burned',
      cheapskate: 'The Cheapskate',
      delusional: 'The Delusional',
      procrastinator: 'The Procrastinator',
      aggressive: 'The Aggressive',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft size={16} />
          Back to Scenarios
        </button>
      </div>

      <div className="max-w-4xl">
        <div className="bg-navy-800 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">{scenario.name}</h1>
              <p className="text-white/60">{scenario.description}</p>
            </div>
            <DifficultyBadge level={scenario.difficulty} showLabel />
          </div>

          <div className="flex gap-4">
            <Link
              href={`/norw/practice?scenario=${scenario.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400"
            >
              <Play size={18} />
              Practice This Scenario
            </Link>
            <Link
              href={`/norw/simulation?scenario=${scenario.id}`}
              className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5"
            >
              Watch Simulation
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Objectives
            </h2>
            <ul className="space-y-3">
              {scenario.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-white/80">{objective}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Common Mistakes to Avoid
            </h2>
            <ul className="space-y-3">
              {scenario.commonMistakes.map((mistake, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span className="text-white/80">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-navy-800 border border-white/10 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Practice With These Homeowner Types
          </h2>
          <div className="flex flex-wrap gap-3">
            {scenario.personas.map((persona) => (
              <Link
                key={persona}
                href={`/norw/practice?scenario=${scenario.id}&persona=${persona}`}
                className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-colors"
              >
                {getPersonaLabel(persona)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
