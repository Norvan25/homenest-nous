'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from 'lucide-react';

interface ScriptSection {
  title: string;
  content: string;
  whyItWorks?: string;
}

interface Script {
  id?: string;
  title: string;
  category: string;
  sections: ScriptSection[];
}

interface ScriptEditorProps {
  script: Script | null;
  onBack: () => void;
  onSave: (script: Script) => void;
}

export function ScriptEditor({ script, onBack, onSave }: ScriptEditorProps) {
  const [title, setTitle] = useState(script?.title || '');
  const [category, setCategory] = useState(script?.category || 'first_meeting');
  const [sections, setSections] = useState<ScriptSection[]>(
    script?.sections || [{ title: '', content: '', whyItWorks: '' }]
  );

  const handleAddSection = () => {
    setSections([...sections, { title: '', content: '', whyItWorks: '' }]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof ScriptSection, value: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const handleSave = () => {
    onSave({
      id: script?.id,
      title,
      category,
      sections,
    });
  };

  const categories = [
    { id: 'first_meeting', name: 'First Meeting' },
    { id: 'objections', name: 'Objections' },
    { id: 'negotiations', name: 'Negotiations' },
    { id: 'closing', name: 'Closing' },
  ];

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft size={16} />
          Back to Scripts
        </button>
        <h1 className="text-2xl font-semibold text-white">
          {script ? 'Edit Script' : 'Create New Script'}
        </h1>
      </div>

      <div className="max-w-3xl">
        <div className="bg-navy-800 border border-white/10 rounded-xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Script Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Expired Listing Opening"
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-navy-800 border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-white/20" />
                  <span className="text-white font-medium">Section {index + 1}</span>
                </div>
                {sections.length > 1 && (
                  <button
                    onClick={() => handleRemoveSection(index)}
                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">
                    Section Title (e.g., &quot;Opening&quot;, &quot;When they say X&quot;)
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                    placeholder="e.g., Opening"
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Script Content</label>
                  <textarea
                    value={section.content}
                    onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                    placeholder="What to say..."
                    rows={4}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">
                    Why It Works (optional)
                  </label>
                  <textarea
                    value={section.whyItWorks || ''}
                    onChange={(e) => handleSectionChange(index, 'whyItWorks', e.target.value)}
                    placeholder="Explain why this language is effective..."
                    rows={2}
                    className="w-full px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddSection}
          className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 flex items-center justify-center gap-2 mb-6"
        >
          <Plus size={18} />
          Add Section
        </button>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={!title || sections.some(s => !s.title || !s.content)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Save Script
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
