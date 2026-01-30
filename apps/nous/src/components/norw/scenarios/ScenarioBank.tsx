'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { ScenarioCard } from './ScenarioCard';
import { ScenarioDetail } from './ScenarioDetail';
import { DifficultyBadge } from '../shared/DifficultyBadge';

interface Scenario {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: number;
  objectives: string[];
  commonMistakes: string[];
  personas: string[];
}

export function ScenarioBank() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setScenarios([
      {
        id: '1',
        name: 'Expired Listing First Meeting',
        category: 'first_meeting',
        description: 'Initial meeting with homeowner whose listing expired with previous agent. They are likely frustrated and skeptical.',
        difficulty: 4,
        objectives: [
          'Build rapport and trust quickly',
          'Understand why the listing didn\'t sell',
          'Present your differentiated approach',
          'Get listing agreement signed',
        ],
        commonMistakes: [
          'Bashing the previous agent',
          'Talking too much about yourself',
          'Not asking enough discovery questions',
          'Rushing to the pitch',
        ],
        personas: ['skeptic', 'burned', 'delusional'],
      },
      {
        id: '2',
        name: 'Commission Objection',
        category: 'objections',
        description: 'Homeowner pushes back on your commission rate, comparing to discount brokers.',
        difficulty: 3,
        objectives: [
          'Maintain your value proposition',
          'Reframe discussion to net proceeds',
          'Show ROI of full-service agent',
          'Hold firm or offer creative alternative',
        ],
        commonMistakes: [
          'Immediately offering discount',
          'Getting defensive',
          'Comparing to discount brokers negatively',
          'Not explaining your specific value',
        ],
        personas: ['cheapskate', 'skeptic'],
      },
      {
        id: '3',
        name: 'Price Reduction Conversation',
        category: 'negotiations',
        description: 'Property has been on market with no offers. Need to convince seller to reduce price.',
        difficulty: 4,
        objectives: [
          'Present market data objectively',
          'Get seller to suggest new price',
          'Maintain relationship and trust',
          'Agree on new strategy going forward',
        ],
        commonMistakes: [
          'Saying "I told you so"',
          'Being too direct about price being wrong',
          'Not having concrete comparable data',
          'Letting them blame you for the situation',
        ],
        personas: ['delusional', 'aggressive', 'burned'],
      },
      {
        id: '4',
        name: 'Getting the Signature',
        category: 'closing',
        description: 'Everything has been discussed. Time to close the listing agreement.',
        difficulty: 3,
        objectives: [
          'Summarize the value proposition',
          'Address any remaining concerns',
          'Create appropriate urgency',
          'Get the signature',
        ],
        commonMistakes: [
          'Not actually asking for the signature',
          'Overselling after they are ready',
          'Introducing new topics at the wrong time',
          'Showing nervousness or desperation',
        ],
        personas: ['procrastinator', 'skeptic'],
      },
      {
        id: '5',
        name: 'FSBO Conversion',
        category: 'first_meeting',
        description: 'Homeowner is trying to sell by themselves. Convince them of agent value.',
        difficulty: 5,
        objectives: [
          'Acknowledge their effort and goals',
          'Identify pain points in their process',
          'Show value without being condescending',
          'Offer to help with specific challenges',
        ],
        commonMistakes: [
          'Telling them they can\'t do it alone',
          'Being condescending about their efforts',
          'Quoting statistics that feel like attacks',
          'Not acknowledging their valid concerns about commission',
        ],
        personas: ['cheapskate', 'skeptic', 'aggressive'],
      },
    ]);
  };

  const categories = [
    { id: 'all', name: 'All Scenarios', count: scenarios.length },
    { id: 'first_meeting', name: 'First Meeting', count: scenarios.filter(s => s.category === 'first_meeting').length },
    { id: 'objections', name: 'Objections', count: scenarios.filter(s => s.category === 'objections').length },
    { id: 'negotiations', name: 'Negotiations', count: scenarios.filter(s => s.category === 'negotiations').length },
    { id: 'closing', name: 'Closing', count: scenarios.filter(s => s.category === 'closing').length },
  ];

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || scenario.category === filterCategory;
    const matchesDifficulty = filterDifficulty === null || scenario.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  if (selectedScenario) {
    return (
      <ScenarioDetail
        scenario={selectedScenario}
        onBack={() => setSelectedScenario(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <div className="mb-6">
        <Link href="/norw" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft size={16} />
          Back to Training Hub
        </Link>
        <h1 className="text-2xl font-semibold text-white">Scenario Bank</h1>
        <p className="text-white/60">Browse and practice difficult real estate conversations</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search scenarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-cyan-500 text-navy-900'
                  : 'bg-navy-800 text-white/60 hover:text-white'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {[null, 3, 4, 5].map((diff) => (
            <button
              key={diff || 'all'}
              onClick={() => setFilterDifficulty(diff)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                filterDifficulty === diff
                  ? 'bg-cyan-500 text-navy-900'
                  : 'bg-navy-800 text-white/60 hover:text-white'
              }`}
            >
              {diff === null ? 'All' : <DifficultyBadge level={diff} />}
            </button>
          ))}
        </div>
      </div>

      {filteredScenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onClick={() => setSelectedScenario(scenario)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No scenarios found</p>
        </div>
      )}
    </div>
  );
}
