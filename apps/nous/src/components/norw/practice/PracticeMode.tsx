'use client';

import { useState } from 'react';
import { ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';
import { PracticeSetup } from './PracticeSetup';
import { PracticeCall } from './PracticeCall';
import { PracticeFeedback } from './PracticeFeedback';

type PracticeStatus = 'setup' | 'ready' | 'calling' | 'feedback';

interface SessionConfig {
  scenarioId: string;
  scenarioName: string;
  personaId: string;
  personaName: string;
  difficulty: number;
  agentId: string;  // ElevenLabs agent ID
  agentName: string;
}

interface FeedbackData {
  score: number;
  metrics: {
    talkListenRatio: number;
    empathyCount: number;
    questionsAsked: number;
    fillerWords: number;
    interruptionCount: number;
  };
  strengths: string[];
  improvements: Array<{
    timestamp: string;
    original: string;
    issue: string;
    suggestion: string;
  }>;
  summary: string;
}

export function PracticeMode() {
  const [status, setStatus] = useState<PracticeStatus>('setup');
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [duration, setDuration] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleStartPractice = (sessionConfig: SessionConfig) => {
    setConfig(sessionConfig);
    setStatus('ready');
  };

  const handleBeginCall = () => {
    setStatus('calling');
    setTranscript([]);
    setDuration(0);
  };

  const handleEndCall = async (finalTranscript: any[], callDuration: number, convId?: string) => {
    setTranscript(finalTranscript);
    setDuration(callDuration);
    setConversationId(convId || null);
    
    // Analyze transcript with Claude
    if (finalTranscript.length > 0) {
      try {
        const response = await fetch('/api/norw/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: finalTranscript,
            scenarioId: config?.scenarioId,
            personaId: config?.personaId,
          }),
        });

        const data = await response.json();
        if (data.success && data.analysis) {
          setFeedback(data.analysis);
        } else {
          // Fallback feedback
          setFeedback(getDefaultFeedback());
        }
      } catch (error) {
        console.error('Error analyzing transcript:', error);
        setFeedback(getDefaultFeedback());
      }
    } else {
      setFeedback(getDefaultFeedback());
    }

    setStatus('feedback');
  };

  const getDefaultFeedback = (): FeedbackData => ({
    score: 0,
    metrics: {
      talkListenRatio: 50,
      empathyCount: 0,
      questionsAsked: 0,
      fillerWords: 0,
      interruptionCount: 0,
    },
    strengths: ['Completed the practice session'],
    improvements: [],
    summary: 'Practice session completed. Continue practicing to improve your skills.',
  });

  const handleReset = () => {
    setStatus('setup');
    setConfig(null);
    setTranscript([]);
    setFeedback(null);
    setDuration(0);
    setConversationId(null);
  };

  const handlePracticeAgain = () => {
    setStatus('ready');
    setTranscript([]);
    setFeedback(null);
    setDuration(0);
    setConversationId(null);
  };

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <div className="mb-6">
        <Link href="/norw" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft size={16} />
          Back to Training Hub
        </Link>
        <h1 className="text-2xl font-semibold text-white">Practice Mode</h1>
        <p className="text-white/60">Practice calls against AI homeowners powered by ElevenLabs</p>
      </div>

      {status === 'setup' && (
        <PracticeSetup onStart={handleStartPractice} />
      )}

      {status === 'ready' && config && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-navy-800 border border-white/10 rounded-xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Ready to Practice</h2>
            <p className="text-white/60 mb-2">
              Scenario: <span className="text-white">{config.scenarioName}</span><br />
              Homeowner: <span className="text-white">{config.personaName}</span>
            </p>
            <p className="text-cyan-400 mb-6">
              AI Agent: <span className="font-medium">{config.agentName}</span>
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 text-left">
              <p className="text-amber-400 text-sm">
                <strong>Note:</strong> Your microphone will be used. The AI agent from ElevenLabs will respond to your voice in real-time.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleBeginCall}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-navy-900 rounded-xl font-medium hover:bg-green-400 text-lg"
              >
                Start Practice Call
              </button>
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5"
              >
                Change Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'calling' && config && (
        <PracticeCall
          config={config}
          onEnd={handleEndCall}
        />
      )}

      {status === 'feedback' && feedback && config && (
        <PracticeFeedback
          feedback={feedback}
          transcript={transcript}
          duration={duration}
          config={config}
          onPracticeAgain={handlePracticeAgain}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
