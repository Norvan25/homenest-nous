'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Clock, User, FileText, Play, RefreshCw, Search, Filter, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { TranscriptViewer } from '../shared/TranscriptViewer';

interface CallLog {
  id: string;
  agentId: string;
  agentName: string;
  phoneNumber: string;
  contactName: string;
  duration: number;
  status: string;
  outcome: string;
  transcript: Array<{ role: string; message: string; timestamp?: number }>;
  recordingUrl?: string;
  createdAt: string;
  analysis?: any;
}

interface Agent {
  id: string;
  name: string;
}

export function CallLogParser() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Filters
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchCallLogs();
  }, [selectedAgent, dateFrom, dateTo]);

  const fetchCallLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAgent !== 'all') params.append('agentId', selectedAgent);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/norw/call-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setCallLogs(data.callLogs || []);
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Error fetching call logs:', error);
    }
    setIsLoading(false);
  };

  const handleAnalyze = async (callLog: CallLog) => {
    setIsAnalyzing(true);
    try {
      // Parse and analyze the call log
      const response = await fetch('/api/norw/call-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: callLog.id,
          analyzeWithClaude: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update the selected log with analysis
        setSelectedLog({
          ...callLog,
          analysis: data.callLog.analysis,
        });

        // Update in the list too
        setCallLogs(prev =>
          prev.map(log =>
            log.id === callLog.id ? { ...log, analysis: data.callLog.analysis } : log
          )
        );
      }
    } catch (error) {
      console.error('Error analyzing call:', error);
    }
    setIsAnalyzing(false);
  };

  const handleGenerateScript = async () => {
    if (!selectedLog) return;
    
    setIsGeneratingScript(true);
    try {
      const response = await fetch('/api/norw/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: selectedLog.transcript,
          analysis: selectedLog.analysis,
          category: 'general',
          title: `Script from ${selectedLog.contactName || 'Call'} - ${new Date(selectedLog.createdAt).toLocaleDateString()}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to script editor
        window.location.href = `/norw/scripts?id=${data.script.id}`;
      }
    } catch (error) {
      console.error('Error generating script:', error);
    }
    setIsGeneratingScript(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      appointment_set: 'bg-green-500/20 text-green-400',
      interested: 'bg-cyan-500/20 text-cyan-400',
      callback: 'bg-amber-500/20 text-amber-400',
      not_interested: 'bg-red-500/20 text-red-400',
      voicemail: 'bg-purple-500/20 text-purple-400',
    };
    return colors[outcome] || 'bg-white/10 text-white/60';
  };

  const filteredLogs = callLogs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.contactName?.toLowerCase().includes(query) ||
        log.phoneNumber?.includes(query) ||
        log.agentName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (selectedLog) {
    return (
      <div className="min-h-screen bg-navy-900 p-6">
        <div className="mb-6">
          <button
            onClick={() => setSelectedLog(null)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft size={16} />
            Back to Call Logs
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">{selectedLog.contactName || 'Call Details'}</h1>
              <p className="text-white/60">{selectedLog.phoneNumber} • {selectedLog.agentName}</p>
            </div>
            <div className="flex gap-3">
              {!selectedLog.analysis && (
                <button
                  onClick={() => handleAnalyze(selectedLog)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with Claude'}
                </button>
              )}
              {selectedLog.analysis && (
                <button
                  onClick={handleGenerateScript}
                  disabled={isGeneratingScript}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-navy-900 rounded-lg hover:bg-cyan-400 disabled:opacity-50"
                >
                  <FileText size={18} />
                  {isGeneratingScript ? 'Generating...' : 'Generate Script with Gemini'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-navy-800 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-medium mb-4">Call Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Date</span>
                  <span className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Duration</span>
                  <span className="text-white">{formatDuration(selectedLog.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Outcome</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getOutcomeColor(selectedLog.outcome)}`}>
                    {selectedLog.outcome || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Status</span>
                  <span className="text-white">{selectedLog.status}</span>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            {selectedLog.analysis && (
              <div className="bg-navy-800 border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  Claude Analysis
                </h3>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold text-cyan-400 mb-1">
                    {selectedLog.analysis.score}/100
                  </div>
                  <div className="text-white/40 text-sm">Overall Score</div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Talk/Listen Ratio</span>
                    <span className="text-white">{selectedLog.analysis.metrics?.talkListenRatio}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Empathy Statements</span>
                    <span className="text-white">{selectedLog.analysis.metrics?.empathyCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Questions Asked</span>
                    <span className="text-white">{selectedLog.analysis.metrics?.questionsAsked}</span>
                  </div>
                </div>

                {selectedLog.analysis.summary && (
                  <p className="text-white/70 text-sm border-t border-white/10 pt-4">
                    {selectedLog.analysis.summary}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="lg:col-span-2">
            <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-white font-medium">Transcript</h3>
              </div>
              <TranscriptViewer 
                transcript={selectedLog.transcript.map((t, i) => ({
                  role: t.role as 'agent' | 'homeowner',
                  message: t.message,
                  timestamp: t.timestamp || i * 5,
                }))} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/norw" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft size={16} />
          Back to Training Hub
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Call Log Parser</h1>
            <p className="text-white/60">Extract and analyze call logs from HomeNest agents</p>
          </div>
          <button
            onClick={fetchCallLogs}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-navy-800 border border-white/10 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy-900 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="From"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
            placeholder="To"
          />
        </div>
      </div>

      {/* Call Logs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {filteredLogs.map(log => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{log.contactName || log.phoneNumber}</div>
                    <div className="text-white/40 text-sm">
                      {log.agentName} • {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-white/60 text-sm">
                      <Clock size={14} />
                      {formatDuration(log.duration)}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${getOutcomeColor(log.outcome)}`}>
                      {log.outcome || 'Unknown'}
                    </span>
                  </div>

                  {log.analysis && (
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-sm">{log.analysis.score}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Phone className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No call logs found</p>
          <p className="text-white/30 text-sm mt-1">
            Make sure you have HomeNest agents configured in ElevenLabs
          </p>
        </div>
      )}
    </div>
  );
}
