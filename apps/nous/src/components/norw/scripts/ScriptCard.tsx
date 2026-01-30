'use client';

import { FileText, Star, ChevronRight } from 'lucide-react';

interface Script {
  id: string;
  title: string;
  category: string;
  sections: Array<{ title: string; content: string }>;
  createdAt: string;
  isTemplate: boolean;
}

interface ScriptCardProps {
  script: Script;
  onClick: () => void;
}

export function ScriptCard({ script, onClick }: ScriptCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      first_meeting: 'bg-cyan-500/20 text-cyan-400',
      objections: 'bg-amber-500/20 text-amber-400',
      negotiations: 'bg-purple-500/20 text-purple-400',
      closing: 'bg-green-500/20 text-green-400',
    };
    return colors[category] || 'bg-white/10 text-white/60';
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
      className="w-full bg-navy-800 border border-white/10 rounded-xl p-5 text-left hover:border-white/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-cyan-400" />
        </div>
        {script.isTemplate && (
          <span className="flex items-center gap-1 text-xs text-amber-400">
            <Star size={12} />
            Template
          </span>
        )}
      </div>
      
      <h3 className="text-white font-medium mb-2 group-hover:text-cyan-400 transition-colors">
        {script.title}
      </h3>
      
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(script.category)}`}>
          {getCategoryLabel(script.category)}
        </span>
        <span className="text-white/40 text-xs">{script.sections.length} sections</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs">{script.createdAt}</span>
        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}
