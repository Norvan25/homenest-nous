'use client';

import { Phone, Maximize2, Pause } from 'lucide-react';

interface CallProgressWidgetProps {
  queues: Array<{
    queueNumber: number;
    settings: {
      is_running: boolean;
      is_paused: boolean;
    };
    stats: {
      total: number;
      pending: number;
      completed: number;
    };
  }>;
  onExpand: () => void;
  onPauseAll: () => void;
}

export function CallProgressWidget({ queues, onExpand, onPauseAll }: CallProgressWidgetProps) {
  const activeQueues = queues.filter(q => q.settings.is_running || q.stats.pending > 0);

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-navy-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="px-4 py-3 bg-navy-900 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-cyan-400" />
          <span className="font-medium text-white">Calls in Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPauseAll}
            className="p-1.5 text-white/40 hover:text-amber-400 rounded"
            title="Pause All"
          >
            <Pause size={14} />
          </button>
          <button
            onClick={onExpand}
            className="p-1.5 text-white/40 hover:text-white rounded"
            title="Expand"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Queue Progress */}
      <div className="p-3 space-y-3">
        {activeQueues.map((queue) => {
          const percent = queue.stats.total > 0
            ? Math.round((queue.stats.completed / queue.stats.total) * 100)
            : 0;
          
          return (
            <div key={queue.queueNumber}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white">Q{queue.queueNumber}</span>
                <span className="text-white/60">
                  {queue.stats.completed}/{queue.stats.total}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    queue.settings.is_paused ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-xs text-white/40 mt-0.5">
                {queue.settings.is_paused ? 'Paused' : queue.settings.is_running ? 'Running' : 'Waiting'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
