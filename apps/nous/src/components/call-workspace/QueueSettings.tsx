'use client';

interface QueueSettingsProps {
  settings: {
    agent_id: string | null;
    voice_id: string | null;
    call_interval_seconds: number;
    schedule_start: string | null;
    schedule_end: string | null;
  };
  agents: Array<{ agent_id: string; name: string }>;
  voices: Array<{ voice_id: string; name: string }>;
  onUpdate: (settings: any) => void;
}

export function QueueSettings({ settings, agents, voices, onUpdate }: QueueSettingsProps) {
  return (
    <div className="p-4 bg-navy-900/50 border-b border-white/10 space-y-4">
      {/* Agent Selection */}
      <div>
        <label className="block text-sm text-white/60 mb-1.5">AI Agent</label>
        <select
          value={settings.agent_id || ''}
          onChange={(e) => onUpdate({ agent_id: e.target.value || null })}
          className="w-full px-3 py-2 bg-navy-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">Select Agent...</option>
          {agents.map((agent) => (
            <option key={agent.agent_id} value={agent.agent_id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Override */}
      <div>
        <label className="block text-sm text-white/60 mb-1.5">Voice Override (optional)</label>
        <select
          value={settings.voice_id || ''}
          onChange={(e) => onUpdate({ voice_id: e.target.value || null })}
          className="w-full px-3 py-2 bg-navy-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">Use Agent Default</option>
          {voices.map((voice) => (
            <option key={voice.voice_id} value={voice.voice_id}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>

      {/* Call Interval */}
      <div>
        <label className="block text-sm text-white/60 mb-1.5">
          Interval Between Calls: {settings.call_interval_seconds}s
        </label>
        <input
          type="range"
          min="10"
          max="120"
          step="10"
          value={settings.call_interval_seconds}
          onChange={(e) => onUpdate({ call_interval_seconds: parseInt(e.target.value) })}
          className="w-full accent-cyan-500"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>10s</span>
          <span>120s</span>
        </div>
      </div>

      {/* Schedule Window */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Start Time</label>
          <input
            type="time"
            value={settings.schedule_start || ''}
            onChange={(e) => onUpdate({ schedule_start: e.target.value || null })}
            className="w-full px-3 py-2 bg-navy-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">End Time</label>
          <input
            type="time"
            value={settings.schedule_end || ''}
            onChange={(e) => onUpdate({ schedule_end: e.target.value || null })}
            className="w-full px-3 py-2 bg-navy-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>
      <p className="text-xs text-white/40">
        Leave empty to call anytime. Uncalled numbers will be released when window ends.
      </p>
    </div>
  );
}
