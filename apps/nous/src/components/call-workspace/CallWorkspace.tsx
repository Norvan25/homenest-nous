'use client';

import { useState, useEffect } from 'react';
import { QueuePanel } from './QueuePanel';
import { CallProgressWidget } from './CallProgressWidget';
import { Minimize2 } from 'lucide-react';

interface QueueData {
  queueNumber: number;
  items: QueueItem[];
  settings: QueueSettings;
  stats: {
    total: number;
    pending: number;
    completed: number;
    inProgress: number;
  };
}

interface QueueItem {
  id: string;
  phone_number: string;
  contact_name: string;
  property_address: string;
  status: string;
  position: number;
}

interface QueueSettings {
  agent_id: string | null;
  voice_id: string | null;
  is_running: boolean;
  is_paused: boolean;
  call_interval_seconds: number;
  schedule_start: string | null;
  schedule_end: string | null;
}

export function CallWorkspace() {
  const [queues, setQueues] = useState<QueueData[]>([]);
  const [agents, setAgents] = useState<Array<{ agent_id: string; name: string }>>([]);
  const [voices, setVoices] = useState<Array<{ voice_id: string; name: string }>>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch queues, agents, and voices on mount
  useEffect(() => {
    fetchQueues();
    fetchAgents();
    fetchVoices();
  }, []);

  // Poll for updates every 5 seconds when any queue is running
  useEffect(() => {
    const interval = setInterval(() => {
      if (queues.some(q => q.settings.is_running)) {
        fetchQueues();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [queues]);

  const fetchQueues = async () => {
    try {
      const promises = [1, 2, 3, 4].map(num =>
        fetch(`/api/call-queue/${num}`).then(r => r.json())
      );
      const results = await Promise.all(promises);
      setQueues(results);
    } catch (error) {
      console.error('Error fetching queues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/elevenlabs/agents');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/elevenlabs/voices');
      const data = await res.json();
      setVoices(data.voices || []);
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  };

  const handleStartQueue = async (queueNumber: number) => {
    try {
      await fetch(`/api/elevenlabs/start-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueNumber }),
      });
      fetchQueues();
    } catch (error) {
      console.error('Error starting queue:', error);
    }
  };

  const handlePauseQueue = async (queueNumber: number) => {
    try {
      await fetch(`/api/call-queue/${queueNumber}/pause`, {
        method: 'POST',
      });
      fetchQueues();
    } catch (error) {
      console.error('Error pausing queue:', error);
    }
  };

  const handleClearQueue = async (queueNumber: number) => {
    try {
      await fetch(`/api/call-queue/${queueNumber}`, {
        method: 'DELETE',
      });
      fetchQueues();
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  };

  const handleUpdateSettings = async (queueNumber: number, settings: Partial<QueueSettings>) => {
    try {
      await fetch(`/api/call-queue/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueNumber, ...settings }),
      });
      fetchQueues();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleStartAll = async () => {
    const queuesToStart = queues.filter(q => q.stats.pending > 0 && !q.settings.is_running);
    for (const queue of queuesToStart) {
      await handleStartQueue(queue.queueNumber);
    }
  };

  const handlePauseAll = async () => {
    const queuesToPause = queues.filter(q => q.settings.is_running);
    for (const queue of queuesToPause) {
      await handlePauseQueue(queue.queueNumber);
    }
  };

  const anyQueueRunning = queues.some(q => q.settings.is_running);

  // Show minimized widget if minimized and any queue is running
  if (isMinimized && anyQueueRunning) {
    return (
      <CallProgressWidget
        queues={queues}
        onExpand={() => setIsMinimized(false)}
        onPauseAll={handlePauseAll}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white/60">Loading queues...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={handleStartAll}
            disabled={!queues.some(q => q.stats.pending > 0 && !q.settings.is_running)}
            className="px-4 py-2 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start All Queues
          </button>
          {anyQueueRunning && (
            <button
              onClick={handlePauseAll}
              className="px-4 py-2 bg-amber-500 text-navy-900 rounded-lg font-medium hover:bg-amber-400"
            >
              Pause All
            </button>
          )}
        </div>
        {anyQueueRunning && (
          <button
            onClick={() => setIsMinimized(true)}
            className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white border border-white/10 rounded-lg"
          >
            <Minimize2 size={16} />
            Minimize
          </button>
        )}
      </div>

      {/* 4 Queue Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {queues.map(queue => (
          <QueuePanel
            key={queue.queueNumber}
            queue={queue}
            agents={agents}
            voices={voices}
            onStart={() => handleStartQueue(queue.queueNumber)}
            onPause={() => handlePauseQueue(queue.queueNumber)}
            onClear={() => handleClearQueue(queue.queueNumber)}
            onUpdateSettings={(settings) => handleUpdateSettings(queue.queueNumber, settings)}
            onRefresh={fetchQueues}
          />
        ))}
      </div>
    </div>
  );
}
