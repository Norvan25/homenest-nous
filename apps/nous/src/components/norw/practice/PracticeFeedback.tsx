'use client';

import { TrendingUp, AlertTriangle, CheckCircle, RotateCcw, FileText } from 'lucide-react';
import { MetricBar } from '../shared/MetricBar';
import { ScoreCard } from '../shared/ScoreCard';

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

interface PracticeFeedbackProps {
  feedback: FeedbackData;
  transcript: any[];
  duration: number;
  config: {
    scenarioName: string;
    personaName: string;
  };
  onPracticeAgain: () => void;
  onReset: () => void;
}

export function PracticeFeedback({ feedback, duration, onPracticeAgain, onReset }: PracticeFeedbackProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ScoreCard score={feedback.score} duration={formatDuration(duration)} />

      <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-cyan-400" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricBar
            label="Talk/Listen Ratio"
            value={feedback.metrics.talkListenRatio}
            target={40}
            unit="%"
            description="Aim for 40% or less (listen more)"
            inverted
          />
          <MetricBar
            label="Empathy Statements"
            value={feedback.metrics.empathyCount}
            target={4}
            description="Aim for 4+ empathy statements"
          />
          <MetricBar
            label="Questions Asked"
            value={feedback.metrics.questionsAsked}
            target={6}
            description="Aim for 6+ open-ended questions"
          />
          <MetricBar
            label="Filler Words"
            value={feedback.metrics.fillerWords}
            target={5}
            description="Aim for less than 5"
            inverted
          />
        </div>
      </div>

      <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-400" />
          What You Did Well
        </h3>
        <ul className="space-y-2">
          {feedback.strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-3 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
              {strength}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-400" />
          Areas to Improve
        </h3>
        <div className="space-y-4">
          {feedback.improvements.map((item, index) => (
            <div key={index} className="bg-navy-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
                <span>At {item.timestamp}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-sm font-medium mt-0.5">✗</span>
                  <div>
                    <p className="text-white/60 text-sm">You said:</p>
                    <p className="text-white">&quot;{item.original}&quot;</p>
                    <p className="text-red-400/80 text-sm mt-1">{item.issue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 text-sm font-medium mt-0.5">✓</span>
                  <div>
                    <p className="text-white/60 text-sm">Try instead:</p>
                    <p className="text-green-400">&quot;{item.suggestion}&quot;</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">AI Trainer Summary</h3>
        <p className="text-white/70 leading-relaxed">{feedback.summary}</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onPracticeAgain}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-navy-900 rounded-lg font-medium hover:bg-cyan-400"
        >
          <RotateCcw size={18} />
          Practice Again
        </button>
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5"
        >
          <FileText size={18} />
          Try Different Scenario
        </button>
      </div>
    </div>
  );
}
