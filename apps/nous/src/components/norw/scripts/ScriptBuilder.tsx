'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ScriptCard } from './ScriptCard';
import { ScriptEditor } from './ScriptEditor';

interface Script {
  id: string;
  title: string;
  category: string;
  sections: Array<{
    title: string;
    content: string;
    whyItWorks?: string;
  }>;
  createdAt: string;
  isTemplate: boolean;
}

export function ScriptBuilder() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    setScripts([
      {
        id: '1',
        title: 'Expired Listing Opening',
        category: 'first_meeting',
        sections: [
          {
            title: 'Opening',
            content: "Hi [NAME], thank you so much for taking the time to meet with me. Before I say anything, I'd love to hear from you — what happened with the listing? What's your take on it?",
            whyItWorks: "Opens with gratitude, immediately gives them the floor, shows you want to listen",
          },
          {
            title: 'When They Say: "Why should I trust you?"',
            content: "That's a completely fair question, and honestly, you shouldn't trust me yet — we just met. What I can do is show you exactly what I'd do differently, and you can decide if it makes sense. Would that be okay?",
            whyItWorks: "Validates skepticism, removes pressure, shifts to demonstration",
          },
        ],
        createdAt: '2 days ago',
        isTemplate: true,
      },
      {
        id: '2',
        title: 'Commission Defense',
        category: 'objections',
        sections: [
          {
            title: 'Initial Response',
            content: "I understand — that's a fair concern. Let me show you how my commission actually puts more money in your pocket, not less.",
            whyItWorks: "Acknowledges concern, reframes to their benefit",
          },
        ],
        createdAt: '1 week ago',
        isTemplate: false,
      },
    ]);
  };

  const categories = [
    { id: 'all', name: 'All Scripts' },
    { id: 'first_meeting', name: 'First Meeting' },
    { id: 'objections', name: 'Objections' },
    { id: 'negotiations', name: 'Negotiations' },
    { id: 'closing', name: 'Closing' },
  ];

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || script.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedScript || isCreating) {
    return (
      <ScriptEditor
        script={selectedScript}
        onBack={() => {
          setSelectedScript(null);
          setIsCreating(false);
        }}
        onSave={() => {
          setSelectedScript(null);
          setIsCreating(false);
          fetchScripts();
        }}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Script Builder</h1>
            <p className="text-white/60">Create and manage your winning scripts</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400"
          >
            <Plus size={18} />
            New Script
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
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
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {filteredScripts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              onClick={() => setSelectedScript(script)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No scripts found</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 text-cyan-400 hover:text-cyan-300"
          >
            Create your first script
          </button>
        </div>
      )}

      <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <p className="text-purple-400 font-medium">Pro Tip</p>
            <p className="text-white/60 text-sm">
              Run simulations in the Simulation Lab, then extract winning scripts automatically.
              The AI will analyze what worked and create ready-to-use scripts for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
