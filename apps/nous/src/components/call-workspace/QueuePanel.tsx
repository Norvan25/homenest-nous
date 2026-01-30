'use client';

import { useState } from 'react';
import { Phone, Play, Pause, Trash2, Settings, Clock, Users } from 'lucide-react';
import { QueueItemList } from './QueueItemList';
import { QueueSettings } from './QueueSettings';

interface QueuePanelProps {
  queue: {
    queueNumber: number;
    items: Array<{
      id: string;
      phone_number: string;
      contact_name: string;
      property_address: string;
      status: string;
      position: number;
    }>;
    settings: {
      agent_id: string | null;
      voice_id: string | null;
      is_running: boolean;
      is_paused: boolean;
      call_interval_seconds: number;
      schedule_start: string | null;
      schedule_end: string | null;
    };
    stats: {
      total: number;
      pending: number;
      completed: number;
      inProgress: number;
    };
  };
  agents: Array<{ agent_id: string; name: string }>;
  voices: Array<{ voice_id: string; name: string }>;
  onStart: () => void;
  onPause: () => void;
  onClear: () => void;
  onUpdateSettings: (settings: any) => void;
  onRefresh: () => void;
}

export function QueuePanel({
  queue,
  agents,
  voices,
  onStart,
  onPause,
  onClear,
  onUpdateSettings,
}: QueuePanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { queueNumber, items, settings, stats } = queue;

  const progressPercent = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const getStatusColor = () => {
    if (settings.is_running && !settings.is_paused) return 'bg-green-500';
    if (settings.is_paused) return 'bg-amber-500';
    return 'bg-white/20';
  };

  const getStatusText = () => {
    if (settings.is_running && !settings.is_paused) return 'Running';
    if (settings.is_paused) return 'Paused';
    if (stats.pending > 0) return 'Ready';
    return 'Empty';
  };

  const isWithinSchedule = () => {
    if (!settings.schedule_start || !settings.schedule_end) return true;
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= settings.schedule_start && currentTime <= settings.schedule_end;
  };

  return (
    <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <h3 className="text-lg font-semibold text-white">Q{queueNumber}</h3>
            <span className="text-sm text-white/40">{getStatusText()}</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white'
            }`}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-white/60">
            <Users size={14} />
            <span>{stats.total} total</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Phone size={14} />
            <span>{stats.pending} pending</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400">
            <span>{stats.completed} done</span>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-white/40 mt-1">{progressPercent}% complete</div>
          </div>
        )}
      </div>

      {/* Settings Panel (collapsible) */}
      {showSettings && (
        <QueueSettings
          settings={settings}
          agents={agents}
          voices={voices}
          onUpdate={onUpdateSettings}
        />
      )}

      {/* Schedule Warning */}
      {settings.schedule_start && settings.schedule_end && !isWithinSchedule() && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Clock size={14} />
            <span>Scheduled: {settings.schedule_start} - {settings.schedule_end}</span>
          </div>
        </div>
      )}

      {/* Queue Items List */}
      <div className="max-h-64 overflow-y-auto">
        {items.length > 0 ? (
          <QueueItemList items={items} />
        ) : (
          <div className="p-8 text-center text-white/40">
            <Phone size={24} className="mx-auto mb-2 opacity-50" />
            <p>No numbers in queue</p>
            <p className="text-xs mt-1">Add leads from NorCRM</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        {settings.is_running && !settings.is_paused ? (
          <button
            onClick={onPause}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-navy-900 rounded-lg font-medium hover:bg-amber-400"
          >
            <Pause size={16} />
            Pause
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={stats.pending === 0 || !settings.agent_id}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={16} />
            {settings.is_paused ? 'Resume' : 'Start'}
          </button>
        )}
        <button
          onClick={onClear}
          disabled={settings.is_running}
          className="px-4 py-2 text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
