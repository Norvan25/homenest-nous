'use client';

interface DifficultyBadgeProps {
  level: number;
  showLabel?: boolean;
}

export function DifficultyBadge({ level, showLabel = false }: DifficultyBadgeProps) {
  const getColor = () => {
    if (level <= 2) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (level <= 3) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getLabel = () => {
    if (level <= 2) return 'Easy';
    if (level <= 3) return 'Medium';
    if (level <= 4) return 'Hard';
    return 'Expert';
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getColor()}`}>
      {showLabel && <span>{getLabel()}</span>}
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-1 h-3 rounded-sm ${i <= level ? 'bg-current' : 'bg-current opacity-20'}`}
          />
        ))}
      </span>
    </span>
  );
}
