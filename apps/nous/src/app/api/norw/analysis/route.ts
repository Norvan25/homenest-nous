import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TranscriptEntry {
  role: 'agent' | 'homeowner';
  message: string;
  timestamp: number;
}

interface AnalysisRequest {
  sessionId?: string;
  transcript: TranscriptEntry[];
  scenarioId?: string;
  personaId?: string;
}

// POST - Analyze transcript with Claude
export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { sessionId, transcript, scenarioId, personaId } = body;

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Fetch scenario and persona if provided
    let scenario = null;
    let persona = null;

    if (scenarioId) {
      const { data } = await supabase
        .from('norw_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      scenario = data;
    }

    if (personaId) {
      const { data } = await supabase
        .from('norw_personas')
        .select('*')
        .eq('id', personaId)
        .single();
      persona = data;
    }

    // Format transcript for analysis
    const formattedTranscript = transcript
      .map(entry => `[${formatTimestamp(entry.timestamp)}] ${entry.role.toUpperCase()}: ${entry.message}`)
      .join('\n\n');

    // Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(formattedTranscript, scenario, persona);

    // Call Claude for analysis
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    // Parse Claude's response
    const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
    const analysis = parseAnalysisResponse(analysisText);

    // Save analysis to session if sessionId provided
    if (sessionId) {
      await supabase
        .from('norw_sessions')
        .update({
          score: analysis.score,
          metrics: analysis.metrics,
          ai_feedback: analysis,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function buildAnalysisPrompt(transcript: string, scenario: any, persona: any): string {
  let context = '';
  
  if (scenario) {
    context += `\nSCENARIO: ${scenario.name}
OBJECTIVES: ${scenario.objectives?.join(', ') || 'Build rapport and close'}
COMMON MISTAKES TO AVOID: ${scenario.common_mistakes?.join(', ') || 'Being pushy'}`;
  }

  if (persona) {
    context += `\nHOMEOWNER TYPE: ${persona.name} (${persona.type})
DIFFICULTY: ${persona.difficulty}/5`;
  }

  return `You are an expert real estate sales trainer analyzing a conversation between an agent and a homeowner.
${context}

TRANSCRIPT:
${transcript}

Analyze this conversation and provide a detailed assessment. Return your analysis in the following JSON format:

{
  "score": <number 0-100>,
  "metrics": {
    "talkListenRatio": <percentage of time agent talked>,
    "empathyCount": <number of empathy statements made>,
    "questionsAsked": <number of open-ended questions>,
    "fillerWords": <estimated count of um, uh, like, etc>,
    "interruptionCount": <number of times agent interrupted>,
    "objectionsHandled": <number of objections properly addressed>,
    "rapportBuilding": <score 1-10>
  },
  "strengths": [
    "<specific thing agent did well with timestamp>",
    "<another strength>"
  ],
  "improvements": [
    {
      "timestamp": "<when it happened>",
      "original": "<what the agent said>",
      "issue": "<what was wrong>",
      "suggestion": "<better alternative phrasing>"
    }
  ],
  "objectivesAchieved": [
    {"objective": "<objective>", "achieved": true/false, "notes": "<how or why not>"}
  ],
  "mistakesMade": [
    "<specific mistake from the common mistakes list if applicable>"
  ],
  "summary": "<2-3 sentence overall assessment>",
  "nextSteps": [
    "<specific recommendation for improvement>"
  ]
}

Be specific with timestamps and quotes. Be constructive but honest. Focus on actionable feedback.`;
}

function parseAnalysisResponse(text: string): any {
  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse analysis JSON:', e);
  }

  // Return a default structure if parsing fails
  return {
    score: 0,
    metrics: {
      talkListenRatio: 50,
      empathyCount: 0,
      questionsAsked: 0,
      fillerWords: 0,
      interruptionCount: 0,
    },
    strengths: [],
    improvements: [],
    summary: text,
    nextSteps: ['Review the conversation and identify areas for improvement'],
  };
}
