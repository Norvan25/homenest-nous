'use client';

interface MetricBarProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  description?: string;
  inverted?: boolean;
}

export function MetricBar({ label, value, target, unit = '', description, inverted }: MetricBarProps) {
  const percentage = Math.min((value / (target * 2)) * 100, 100);
  const isGood = inverted ? value <= target : value >= target;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white text-sm">{label}</span>
        <span className={`text-sm font-medium ${isGood ? 'text-green-400' : 'text-amber-400'}`}>
          {value}{unit}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isGood ? 'bg-green-500' : 'bg-amber-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {description && (
        <p className="text-xs text-white/40 mt-1">{description}</p>
      )}
    </div>
  );
}
