'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, FileText, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { PersonaSelector } from './PersonaSelector';
import { VoiceSelector } from './VoiceSelector';
import { TranscriptViewer } from '../shared/TranscriptViewer';

interface Scenario {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: number;
}

interface Persona {
  id: string;
  name: string;
  type: string;
  description: string;
  difficulty: number;
}

type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';

interface TranscriptEntry {
  role: 'agent' | 'homeowner';
  message: string;
  timestamp: number;
}

export function SimulationLab() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [agentVoice, setAgentVoice] = useState<string>('');
  const [homeownerVoice, setHomeownerVoice] = useState<string>('');
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    fetchScenarios();
    fetchPersonas();
  }, []);

  const fetchScenarios = async () => {
    setScenarios([
      { id: '1', name: 'Expired Listing First Meeting', category: 'first_meeting', description: 'Initial meeting with homeowner whose listing expired', difficulty: 4 },
      { id: '2', name: 'Commission Objection', category: 'objections', description: 'Homeowner pushes back on your commission rate', difficulty: 3 },
      { id: '3', name: 'Price Reduction Conversation', category: 'negotiations', description: 'Need to convince seller to reduce price', difficulty: 4 },
      { id: '4', name: 'Getting the Signature', category: 'closing', description: 'Close the listing agreement', difficulty: 3 },
    ]);
  };

  const fetchPersonas = async () => {
    setPersonas([
      { id: '1', name: 'The Skeptic', type: 'skeptic', description: 'Questions everything, needs proof', difficulty: 4 },
      { id: '2', name: 'The Burned', type: 'burned', description: 'Bad experience with previous agents', difficulty: 4 },
      { id: '3', name: 'The Cheapskate', type: 'cheapskate', description: 'Focused on costs and fees', difficulty: 3 },
      { id: '4', name: 'The Delusional', type: 'delusional', description: 'Believes property worth more', difficulty: 5 },
      { id: '5', name: 'The Procrastinator', type: 'procrastinator', description: 'Avoids making decisions', difficulty: 3 },
      { id: '6', name: 'The Aggressive', type: 'aggressive', description: 'Confrontational, tries to dominate', difficulty: 5 },
    ]);
  };

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [simulationConfig, setSimulationConfig] = useState<any>(null);

  const handleStartSimulation = async () => {
    if (!selectedScenario || !selectedPersona) return;
    
    setStatus('running');
    setTranscript([]);
    setCurrentTime(0);
    
    try {
      // Start simulation via API
      const response = await fetch('/api/norw/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario,
          personaId: selectedPersona,
          agentVoiceId: agentVoice,
          homeownerVoiceId: homeownerVoice,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.session.id);
        setSimulationConfig(data.config);
        // Run the AI conversation simulation
        runAISimulation(data.config);
      } else {
        console.error('Simulation start failed:', data.error);
        setStatus('idle');
      }
    } catch (error) {
      console.error('Simulation error:', error);
      setStatus('idle');
    }
  };

  const runAISimulation = async (config: any) => {
    // For now, use Claude to generate a realistic conversation
    // In production, this would connect to ElevenLabs for voice
    const placeholderTranscript: TranscriptEntry[] = [
      { role: 'agent', message: "Hi, thank you so much for taking the time to meet with me today. Before I say anything, I'd love to hear from you — what happened with the listing?", timestamp: 0 },
      { role: 'homeowner', message: "Look, I've had three agents already and none of them could sell it. Why should you be any different?", timestamp: 8 },
      { role: 'agent', message: "That's a completely fair question, and honestly, you shouldn't trust me yet — we just met. What I can do is show you exactly what I'd do differently, and you can decide if it makes sense.", timestamp: 15 },
      { role: 'homeowner', message: "Fine. But I'm not lowering my price. The house is worth what I'm asking.", timestamp: 28 },
      { role: 'agent', message: "I hear you. Let me ask — when buyers came through, what kind of feedback did you get? What were they saying?", timestamp: 35 },
      { role: 'homeowner', message: "They said it was too expensive. But they don't understand - this neighborhood is changing, prices are going up.", timestamp: 42 },
      { role: 'agent', message: "You're absolutely right that the neighborhood is evolving. Tell me more about what attracted you to this area originally?", timestamp: 50 },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < placeholderTranscript.length) {
        setTranscript(prev => [...prev, placeholderTranscript[index]]);
        setCurrentTime(placeholderTranscript[index].timestamp);
        index++;
      } else {
        clearInterval(interval);
        setStatus('completed');
        // Save completed transcript
        if (sessionId) {
          saveTranscript(placeholderTranscript);
        }
      }
    }, 3000);
  };

  const saveTranscript = async (finalTranscript: TranscriptEntry[]) => {
    if (!sessionId) return;
    
    try {
      await fetch('/api/norw/simulation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transcript: finalTranscript,
          status: 'completed',
          duration: finalTranscript[finalTranscript.length - 1]?.timestamp || 0,
        }),
      });
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };

  const handlePauseSimulation = () => {
    setStatus(status === 'paused' ? 'running' : 'paused');
  };

  const handleResetSimulation = () => {
    setStatus('idle');
    setTranscript([]);
    setCurrentTime(0);
  };

  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractScript = async () => {
    if (transcript.length === 0) return;
    
    setIsExtracting(true);
    try {
      // First, analyze with Claude
      const analysisResponse = await fetch('/api/norw/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transcript,
          scenarioId: selectedScenario,
          personaId: selectedPersona,
        }),
      });

      const analysisData = await analysisResponse.json();

      // Then generate script with Gemini
      const scriptResponse = await fetch('/api/norw/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          analysis: analysisData.analysis,
          category: scenarios.find(s => s.id === selectedScenario)?.category || 'general',
          scenarioId: selectedScenario,
          title: `Script from ${scenarios.find(s => s.id === selectedScenario)?.name || 'Simulation'}`,
        }),
      });

      const scriptData = await scriptResponse.json();
      
      if (scriptData.success && scriptData.script.id) {
        // Redirect to the script editor
        window.location.href = `/norw/scripts?id=${scriptData.script.id}`;
      }
    } catch (error) {
      console.error('Error extracting script:', error);
    }
    setIsExtracting(false);
  };

  const canStart = selectedScenario && selectedPersona && agentVoice && homeownerVoice;

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <div className="mb-6">
        <Link href="/norw" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft size={16} />
          Back to Training Hub
        </Link>
        <h1 className="text-2xl font-semibold text-white">Simulation Lab</h1>
        <p className="text-white/60">Watch AI Agent vs AI Homeowner conversations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-navy-800 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Scenario</h3>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              disabled={status === 'running'}
              className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Select a scenario...</option>
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
            {selectedScenario && (
              <p className="mt-2 text-sm text-white/40">
                {scenarios.find(s => s.id === selectedScenario)?.description}
              </p>
            )}
          </div>

          <div className="bg-navy-800 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Homeowner Personality</h3>
            <PersonaSelector
              personas={personas}
              selected={selectedPersona}
              onSelect={setSelectedPersona}
              disabled={status === 'running'}
            />
          </div>

          <div className="bg-navy-800 border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Voices</h3>
            <VoiceSelector
              label="Agent Voice"
              value={agentVoice}
              onChange={setAgentVoice}
              disabled={status === 'running'}
            />
            <div className="mt-4">
              <VoiceSelector
                label="Homeowner Voice"
                value={homeownerVoice}
                onChange={setHomeownerVoice}
                disabled={status === 'running'}
              />
            </div>
          </div>

          <div className="bg-navy-800 border border-white/10 rounded-xl p-5">
            <div className="space-y-3">
              {status === 'idle' && (
                <button
                  onClick={handleStartSimulation}
                  disabled={!canStart}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} />
                  Run Simulation
                </button>
              )}
              
              {(status === 'running' || status === 'paused') && (
                <>
                  <button
                    onClick={handlePauseSimulation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-navy-900 rounded-lg font-medium hover:bg-amber-400"
                  >
                    {status === 'paused' ? <Play size={18} /> : <Pause size={18} />}
                    {status === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleResetSimulation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-white/5"
                  >
                    <RotateCcw size={18} />
                    Reset
                  </button>
                </>
              )}

              {status === 'completed' && (
                <>
                  <button
                    onClick={handleExtractScript}
                    disabled={isExtracting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50"
                  >
                    <FileText size={18} />
                    {isExtracting ? 'Extracting...' : 'Extract Script (Gemini)'}
                  </button>
                  <button
                    onClick={handleResetSimulation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-white/5"
                  >
                    <RotateCcw size={18} />
                    Run Again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden h-full">
            {status === 'idle' ? (
              <div className="flex flex-col items-center justify-center h-96 text-white/40">
                <Play size={48} className="mb-4 opacity-50" />
                <p className="text-lg">Configure and run a simulation</p>
                <p className="text-sm mt-1">Select a scenario, persona, and voices to begin</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'running' ? 'bg-green-500 animate-pulse' :
                      status === 'paused' ? 'bg-amber-500' :
                      'bg-cyan-500'
                    }`} />
                    <span className="text-white font-medium">
                      {status === 'running' ? 'Simulation in Progress' :
                       status === 'paused' ? 'Paused' :
                       'Simulation Complete'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <Volume2 size={16} />
                    <span className="text-sm">{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                <TranscriptViewer 
                  transcript={transcript}
                  isLive={status === 'running'}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
