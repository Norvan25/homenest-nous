import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getElevenLabs } from '@/lib/elevenlabs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// HomeNest agent IDs for filtering
const HOMENEST_AGENT_IDS = process.env.HOMENEST_AGENT_IDS?.split(',') || [];

interface SimulationConfig {
  scenarioId: string;
  personaId: string;
  agentVoiceId: string;
  homeownerVoiceId: string;
}

// POST - Start AI-to-AI simulation
export async function POST(request: NextRequest) {
  try {
    const body: SimulationConfig = await request.json();
    const { scenarioId, personaId, agentVoiceId, homeownerVoiceId } = body;

    // Fetch scenario details
    const { data: scenario, error: scenarioError } = await supabase
      .from('norw_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (scenarioError || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Fetch persona details
    const { data: persona, error: personaError } = await supabase
      .from('norw_personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from('norw_sessions')
      .insert({
        session_type: 'simulation',
        scenario_id: scenarioId,
        persona_id: personaId,
        agent_voice_id: agentVoiceId,
        homeowner_voice_id: homeownerVoiceId,
        status: 'in_progress',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Build AI prompts for simulation
    const agentSystemPrompt = buildAgentPrompt(scenario);
    const homeownerSystemPrompt = buildHomeownerPrompt(scenario, persona);

    // For AI-to-AI simulation, we need to use ElevenLabs Conversational AI
    // This creates two agents that talk to each other
    const elevenlabs = getElevenLabs();

    // Note: ElevenLabs doesn't natively support AI-to-AI conversations
    // We'll simulate this by running alternating text-to-speech and speech-to-text
    // For now, return the session with prompts for client-side orchestration
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        status: 'in_progress',
      },
      config: {
        agentPrompt: agentSystemPrompt,
        homeownerPrompt: homeownerSystemPrompt,
        agentVoiceId,
        homeownerVoiceId,
        scenario: {
          name: scenario.name,
          context: scenario.context || scenario.description,
          objectives: scenario.objectives,
        },
        persona: {
          name: persona.name,
          type: persona.type,
          commonPhrases: persona.common_phrases,
        },
      },
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH - Update simulation with transcript
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, transcript, status, duration } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (transcript) updateData.transcript = transcript;
    if (status) updateData.status = status;
    if (duration) updateData.duration_seconds = duration;
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('norw_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, session: data });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function buildAgentPrompt(scenario: any): string {
  return `You are an expert real estate agent practicing the scenario: "${scenario.name}".

CONTEXT: ${scenario.context || scenario.description}

YOUR OBJECTIVES:
${scenario.objectives?.map((obj: string, i: number) => `${i + 1}. ${obj}`).join('\n') || 'Build rapport and close the deal'}

AVOID THESE MISTAKES:
${scenario.common_mistakes?.map((m: string) => `- ${m}`).join('\n') || '- Being pushy\n- Talking too much'}

COMMUNICATION STYLE:
- Be empathetic and listen actively
- Ask open-ended questions
- Use "I understand" and validate their concerns
- Guide don't push
- Aim for 40% talk, 60% listen ratio
- Use specific data when available

Start the conversation naturally and work toward your objectives.`;
}

function buildHomeownerPrompt(scenario: any, persona: any): string {
  return `You are a homeowner with the personality type: "${persona.name}" (${persona.type}).

PERSONALITY DESCRIPTION: ${persona.description}

YOUR CORE FEAR: ${persona.core_fear || 'Being taken advantage of'}

WHAT YOU NEED FROM THE AGENT: ${persona.what_they_need || 'Trust, honesty, and proof'}

THINGS YOU MIGHT SAY:
${persona.common_phrases?.map((p: string) => `- "${p}"`).join('\n') || '- "I need to think about it"'}

SCENARIO CONTEXT: ${scenario.context || scenario.description}

BEHAVIOR GUIDELINES:
- Stay in character throughout the conversation
- Don't make it too easy - push back appropriately for your personality
- Respond naturally to good rapport-building
- If the agent addresses your concerns well, gradually warm up
- You can eventually agree if the agent handles objections properly
- Your difficulty level is ${persona.difficulty}/5

Respond naturally as this homeowner would in a real conversation.`;
}
