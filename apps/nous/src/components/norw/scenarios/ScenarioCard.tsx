'use client';

import { ChevronRight, Target } from 'lucide-react';
import { DifficultyBadge } from '../shared/DifficultyBadge';

interface ScenarioCardProps {
  scenario: {
    id: string;
    name: string;
    category: string;
    description: string;
    difficulty: number;
    objectives: string[];
    personas: string[];
  };
  onClick: () => void;
}

export function ScenarioCard({ scenario, onClick }: ScenarioCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      first_meeting: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      objections: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      negotiations: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      closing: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[category] || 'bg-white/10 text-white/60 border-white/20';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      first_meeting: 'First Meeting',
      objections: 'Objections',
      negotiations: 'Negotiations',
      closing: 'Closing',
    };
    return labels[category] || category;
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-navy-800 border border-white/10 rounded-xl p-5 text-left hover:border-cyan-500/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(scenario.category)}`}>
          {getCategoryLabel(scenario.category)}
        </span>
        <DifficultyBadge level={scenario.difficulty} />
      </div>

      <h3 className="text-white font-medium text-lg mb-2 group-hover:text-cyan-400 transition-colors">
        {scenario.name}
      </h3>

      <p className="text-white/50 text-sm mb-4 line-clamp-2">
        {scenario.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-white/40 text-xs">
          <Target size={12} />
          <span>{scenario.objectives.length} objectives</span>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}
