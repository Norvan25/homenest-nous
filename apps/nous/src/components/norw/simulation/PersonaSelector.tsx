'use client';

import { DifficultyBadge } from '../shared/DifficultyBadge';

interface Persona {
  id: string;
  name: string;
  type: string;
  description: string;
  difficulty: number;
}

interface PersonaSelectorProps {
  personas: Persona[];
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function PersonaSelector({ personas, selected, onSelect, disabled }: PersonaSelectorProps) {
  const getTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      skeptic: '🤨',
      burned: '😔',
      cheapskate: '💰',
      delusional: '🌟',
      procrastinator: '⏰',
      aggressive: '😤',
    };
    return emojis[type] || '👤';
  };

  return (
    <div className="space-y-2">
      {personas.map((persona) => (
        <button
          key={persona.id}
          onClick={() => onSelect(persona.id)}
          disabled={disabled}
          className={`w-full p-3 rounded-lg border text-left transition-all ${
            selected === persona.id
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getTypeEmoji(persona.type)}</span>
              <span className="text-white font-medium">{persona.name}</span>
            </div>
            <DifficultyBadge level={persona.difficulty} />
          </div>
          <p className="text-sm text-white/40 pl-7">{persona.description}</p>
        </button>
      ))}
    </div>
  );
}
