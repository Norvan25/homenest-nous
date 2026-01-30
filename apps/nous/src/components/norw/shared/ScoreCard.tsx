'use client';

import { Award } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  duration?: string;
}

export function ScoreCard({ score, duration }: ScoreCardProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great Job!';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Keep Practicing';
    return 'Needs Work';
  };

  const getScoreBg = () => {
    if (score >= 80) return 'from-green-500/20 to-green-500/5 border-green-500/30';
    if (score >= 60) return 'from-amber-500/20 to-amber-500/5 border-amber-500/30';
    return 'from-red-500/20 to-red-500/5 border-red-500/30';
  };

  return (
    <div className={`bg-gradient-to-br ${getScoreBg()} border rounded-xl p-8 text-center`}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <Award className={`w-8 h-8 ${getScoreColor()}`} />
        <span className="text-white/60">Practice Session Complete</span>
      </div>
      <div className={`text-6xl font-bold ${getScoreColor()} mb-2`}>
        {score}
      </div>
      <div className="text-white text-xl mb-1">{getScoreLabel()}</div>
      {duration && (
        <div className="text-white/40 text-sm">Duration: {duration}</div>
      )}
    </div>
  );
}
