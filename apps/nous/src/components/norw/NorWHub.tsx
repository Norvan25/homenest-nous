'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Mic, 
  FileText, 
  BookOpen, 
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  Phone
} from 'lucide-react';

interface TrainingStats {
  totalSessions: number;
  practiceHours: number;
  averageScore: number;
  scriptsCreated: number;
}

export function NorWHub() {
  const [stats, setStats] = useState<TrainingStats>({
    totalSessions: 0,
    practiceHours: 0,
    averageScore: 0,
    scriptsCreated: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentSessions();
  }, []);

  const fetchStats = async () => {
    setStats({
      totalSessions: 12,
      practiceHours: 4.5,
      averageScore: 78,
      scriptsCreated: 5,
    });
  };

  const fetchRecentSessions = async () => {
    setRecentSessions([
      { id: '1', type: 'practice', scenario: 'Expired Listing', score: 82, date: '2 hours ago' },
      { id: '2', type: 'simulation', scenario: 'Price Reduction', score: null, date: 'Yesterday' },
      { id: '3', type: 'practice', scenario: 'Commission Objection', score: 71, date: '2 days ago' },
    ]);
  };

  const modes = [
    {
      id: 'simulation',
      name: 'Simulation Lab',
      description: 'Watch AI Agent vs AI Homeowner conversations. Learn from perfect examples.',
      icon: Play,
      color: 'cyan',
      href: '/norw/simulation',
      badge: 'Learn',
    },
    {
      id: 'practice',
      name: 'Practice Mode',
      description: 'Practice calls against AI homeowners. Get instant feedback from AI trainer.',
      icon: Mic,
      color: 'green',
      href: '/norw/practice',
      badge: 'Practice',
    },
    {
      id: 'scripts',
      name: 'Script Builder',
      description: 'Generate and customize winning scripts from successful conversations.',
      icon: FileText,
      color: 'amber',
      href: '/norw/scripts',
      badge: 'Build',
    },
    {
      id: 'scenarios',
      name: 'Scenario Bank',
      description: 'Browse pre-built difficult situations. Prepare for any conversation.',
      icon: BookOpen,
      color: 'purple',
      href: '/norw/scenarios',
      badge: 'Explore',
    },
    {
      id: 'call-logs',
      name: 'Call Log Parser',
      description: 'Extract and analyze real call logs from HomeNest agents. Learn from actual conversations.',
      icon: Phone,
      color: 'pink',
      href: '/norw/call-logs',
      badge: 'Analyze',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', badge: 'bg-cyan-500' },
      green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', badge: 'bg-green-500' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', badge: 'bg-purple-500' },
      pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30', badge: 'bg-pink-500' },
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">NorW Training Hub</h1>
            <p className="text-white/60">Master every conversation. Close every deal.</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
            <Play size={14} />
            Sessions
          </div>
          <div className="text-2xl font-semibold text-white">{stats.totalSessions}</div>
        </div>
        <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
            <Clock size={14} />
            Practice Hours
          </div>
          <div className="text-2xl font-semibold text-white">{stats.practiceHours}</div>
        </div>
        <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
            <TrendingUp size={14} />
            Avg Score
          </div>
          <div className="text-2xl font-semibold text-white">{stats.averageScore}%</div>
        </div>
        <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
            <FileText size={14} />
            Scripts
          </div>
          <div className="text-2xl font-semibold text-white">{stats.scriptsCreated}</div>
        </div>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {modes.map((mode) => {
          const colors = getColorClasses(mode.color);
          const Icon = mode.icon;
          
          return (
            <Link
              key={mode.id}
              href={mode.href}
              className={`group bg-navy-800 border ${colors.border} rounded-xl p-6 hover:border-opacity-60 transition-all hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${colors.badge} text-navy-900`}>
                  {mode.badge}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {mode.name}
              </h3>
              <p className="text-white/60 text-sm mb-4">
                {mode.description}
              </p>
              <div className={`flex items-center gap-1 text-sm ${colors.text}`}>
                Get Started
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Sessions */}
      <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Recent Training Sessions</h2>
        </div>
        {recentSessions.length > 0 ? (
          <div className="divide-y divide-white/5">
            {recentSessions.map((session) => (
              <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    session.type === 'practice' ? 'bg-green-500/10' : 'bg-cyan-500/10'
                  }`}>
                    {session.type === 'practice' ? (
                      <Mic className="w-5 h-5 text-green-400" />
                    ) : (
                      <Play className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{session.scenario}</div>
                    <div className="text-white/40 text-sm capitalize">{session.type} • {session.date}</div>
                  </div>
                </div>
                {session.score !== null && (
                  <div className="flex items-center gap-2">
                    <Award className={`w-4 h-4 ${
                      session.score >= 80 ? 'text-green-400' : 
                      session.score >= 60 ? 'text-amber-400' : 'text-red-400'
                    }`} />
                    <span className="text-white font-medium">{session.score}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-white/40">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No training sessions yet</p>
            <p className="text-sm">Start with a simulation to learn the ropes</p>
          </div>
        )}
      </div>
    </div>
  );
}
