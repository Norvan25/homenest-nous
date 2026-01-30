'use client';

import { useState, useEffect } from 'react';
import { Bot, RefreshCw, AlertCircle } from 'lucide-react';
import { DifficultyBadge } from '../shared/DifficultyBadge';

interface PracticeAgent {
  agent_id: string;
  name: string;
  description?: string;
  persona_type?: string;
}

interface PracticeSetupProps {
  onStart: (config: {
    scenarioId: string;
    scenarioName: string;
    personaId: string;
    personaName: string;
    difficulty: number;
    agentId: string;
    agentName: string;
  }) => void;
}

export function PracticeSetup({ onStart }: PracticeSetupProps) {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [agents, setAgents] = useState<PracticeAgent[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<PracticeAgent | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);

  useEffect(() => {
    // Load scenarios
    setScenarios([
      { id: '1', name: 'Expired Listing First Meeting', category: 'first_meeting', description: 'Initial meeting with homeowner whose listing expired', difficulty: 4, objectives: ['Build rapport', 'Understand situation', 'Present approach', 'Get agreement'] },
      { id: '2', name: 'Commission Objection', category: 'objections', description: 'Homeowner pushes back on your commission rate', difficulty: 3, objectives: ['Maintain value', 'Reframe to ROI', 'Hold firm'] },
      { id: '3', name: 'Price Reduction Conversation', category: 'negotiations', description: 'Need to convince seller to reduce price', difficulty: 4, objectives: ['Present data', 'Get buy-in', 'Maintain relationship'] },
      { id: '4', name: 'Getting the Signature', category: 'closing', description: 'Close the listing agreement', difficulty: 3, objectives: ['Summarize value', 'Address concerns', 'Get signature'] },
    ]);

    // Load personas
    setPersonas([
      { id: '1', name: 'The Skeptic', type: 'skeptic', description: 'Questions everything', difficulty: 4 },
      { id: '2', name: 'The Burned', type: 'burned', description: 'Bad past experience', difficulty: 4 },
      { id: '3', name: 'The Cheapskate', type: 'cheapskate', description: 'Focused on costs', difficulty: 3 },
      { id: '4', name: 'The Delusional', type: 'delusional', description: 'Unrealistic price expectations', difficulty: 5 },
      { id: '5', name: 'The Procrastinator', type: 'procrastinator', description: 'Avoids decisions', difficulty: 3 },
    ]);

    // Load practice agents (filtered by allowed IDs)
    fetchPracticeAgents();
  }, []);

  const fetchPracticeAgents = async () => {
    setIsLoadingAgents(true);
    setAgentError(null);
    
    try {
      // Fetch only practice-specific agents
      const response = await fetch('/api/norw/practice/agents');
      const data = await response.json();
      
      if (data.success && data.agents && data.agents.length > 0) {
        setAgents(data.agents);
        // Auto-select first agent
        setSelectedAgent(data.agents[0]);
      } else if (data.error) {
        setAgentError(data.error);
      } else {
        setAgentError('No practice agents configured. Please add agent IDs to NORW_PRACTICE_AGENT_IDS.');
      }
    } catch (error) {
      console.error('Error fetching practice agents:', error);
      setAgentError('Failed to load practice agents');
    }
    
    setIsLoadingAgents(false);
  };

  const handleStart = () => {
    if (!selectedScenario || !selectedPersona || !selectedAgent) return;
    
    onStart({
      scenarioId: selectedScenario.id,
      scenarioName: selectedScenario.name,
      personaId: selectedPersona.id,
      personaName: selectedPersona.name,
      difficulty: Math.max(selectedScenario.difficulty, selectedPersona.difficulty),
      agentId: selectedAgent.agent_id,
      agentName: selectedAgent.name,
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      first_meeting: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      objections: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      negotiations: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      closing: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[category] || 'bg-white/10 text-white/60 border-white/20';
  };

  const canStart = selectedScenario && selectedPersona && selectedAgent;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Agent Selection - Most Important */}
        <div className="bg-navy-800 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bot size={20} className="text-cyan-400" />
              Select Practice Agent
            </h3>
            <button
              onClick={fetchPracticeAgents}
              disabled={isLoadingAgents}
              className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5"
            >
              <RefreshCw size={16} className={isLoadingAgents ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {isLoadingAgents ? (
            <div className="py-8 text-center text-white/40">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
              Loading practice agents...
            </div>
          ) : agentError ? (
            <div className="py-6 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <p className="text-amber-400 text-sm">{agentError}</p>
              <p className="text-white/40 text-xs mt-2">
                Add ElevenLabs agent IDs to your .env.local file
              </p>
            </div>
          ) : agents.length > 0 ? (
            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.agent_id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedAgent?.agent_id === agent.agent_id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Bot size={20} className="text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{agent.name}</div>
                      {agent.description && (
                        <div className="text-white/40 text-sm">{agent.description}</div>
                      )}
                      {agent.persona_type && (
                        <div className="text-cyan-400/60 text-xs mt-1">Persona: {agent.persona_type}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Bot className="w-8 h-8 mx-auto text-white/20 mb-2" />
              <p className="text-white/40">No practice agents configured</p>
            </div>
          )}
        </div>

        {/* Scenario Selection */}
        <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Scenario</h3>
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  selectedScenario?.id === scenario.id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{scenario.name}</span>
                  <DifficultyBadge level={scenario.difficulty} />
                </div>
                <p className="text-sm text-white/40 mb-3">{scenario.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(scenario.category)}`}>
                    {scenario.category.replace('_', ' ')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Persona Selection */}
        <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Homeowner Type</h3>
          <div className="space-y-2">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedPersona?.id === persona.id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{persona.name}</span>
                  <DifficultyBadge level={persona.difficulty} />
                </div>
                <p className="text-sm text-white/40 mt-1">{persona.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Summary & Start */}
        <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Practice Summary</h3>
          
          {canStart ? (
            <>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">AI Agent:</span>
                  <span className="text-cyan-400 font-medium">{selectedAgent?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Scenario:</span>
                  <span className="text-white">{selectedScenario?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Homeowner:</span>
                  <span className="text-white">{selectedPersona?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Combined Difficulty:</span>
                  <DifficultyBadge level={Math.max(selectedScenario?.difficulty || 1, selectedPersona?.difficulty || 1)} showLabel />
                </div>
              </div>

              {selectedScenario?.objectives && (
                <div className="mb-6">
                  <p className="text-sm text-white/60 mb-2">Your Objectives:</p>
                  <ul className="space-y-1">
                    {selectedScenario.objectives.map((obj: string, i: number) => (
                      <li key={i} className="text-sm text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400"
              >
                Continue to Practice
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/40">
                {!selectedAgent && 'Select an AI agent'}
                {selectedAgent && !selectedScenario && 'Select a scenario'}
                {selectedAgent && selectedScenario && !selectedPersona && 'Select a homeowner type'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
