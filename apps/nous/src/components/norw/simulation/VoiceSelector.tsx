'use client';

import { useState, useEffect } from 'react';
import { Volume2, Play } from 'lucide-react';

interface VoiceSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
}

export function VoiceSelector({ label, value, onChange, disabled }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/elevenlabs/voices');
      const data = await res.json();
      setVoices(data.voices || []);
      
      if (!value && data.voices?.length > 0) {
        onChange(data.voices[0].voice_id);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      setVoices([
        { voice_id: '1', name: 'Sarah (Professional)' },
        { voice_id: '2', name: 'Michael (Warm)' },
        { voice_id: '3', name: 'Emily (Friendly)' },
        { voice_id: '4', name: 'James (Authoritative)' },
      ]);
    }
  };

  const handlePreview = async () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div>
      <label className="block text-sm text-white/60 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
        >
          <option value="">Select voice...</option>
          {voices.map((voice) => (
            <option key={voice.voice_id} value={voice.voice_id}>
              {voice.name}
            </option>
          ))}
        </select>
        <button
          onClick={handlePreview}
          disabled={!value || disabled || isPlaying}
          className="px-3 py-2 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Preview voice"
        >
          {isPlaying ? (
            <Volume2 size={18} className="animate-pulse text-cyan-400" />
          ) : (
            <Play size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
