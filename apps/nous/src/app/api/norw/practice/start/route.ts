import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

interface PracticeStartRequest {
  agentId: string;
  scenarioId?: string;
  personaId?: string;
}

// POST - Start a practice session and get signed WebSocket URL
export async function POST(request: NextRequest) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 });
    }

    const body: PracticeStartRequest = await request.json();
    const { agentId, scenarioId, personaId } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Fetch scenario and persona for context (optional)
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

    // Build dynamic variables for the agent
    const dynamicVariables: Record<string, string> = {};
    
    if (scenario) {
      dynamicVariables.scenario_name = scenario.name || '';
      dynamicVariables.scenario_context = scenario.context || scenario.description || '';
      dynamicVariables.objectives = scenario.objectives?.join(', ') || '';
    }

    if (persona) {
      dynamicVariables.persona_name = persona.name || '';
      dynamicVariables.persona_type = persona.type || '';
      dynamicVariables.persona_behavior = persona.prompt_instructions || persona.description || '';
      dynamicVariables.common_phrases = persona.common_phrases?.join('; ') || '';
    }

    // Get signed URL from ElevenLabs for WebSocket conversation
    const signedUrlResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!signedUrlResponse.ok) {
      const errorText = await signedUrlResponse.text();
      console.error('ElevenLabs signed URL error:', errorText);
      return NextResponse.json(
        { error: `Failed to get conversation URL: ${signedUrlResponse.status}` },
        { status: signedUrlResponse.status }
      );
    }

    const signedUrlData = await signedUrlResponse.json();
    const signedUrl = signedUrlData.signed_url;

    if (!signedUrl) {
      return NextResponse.json({ error: 'No signed URL returned' }, { status: 500 });
    }

    // Create a session record
    const { data: session, error: sessionError } = await supabase
      .from('norw_sessions')
      .insert({
        session_type: 'practice',
        scenario_id: scenarioId || null,
        persona_id: personaId || null,
        status: 'in_progress',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      // Continue anyway - session tracking is optional
    }

    // Append dynamic variables to the WebSocket URL if needed
    let finalUrl = signedUrl;
    if (Object.keys(dynamicVariables).length > 0) {
      const url = new URL(signedUrl);
      Object.entries(dynamicVariables).forEach(([key, value]) => {
        url.searchParams.append(`dynamic_variables[${key}]`, value);
      });
      finalUrl = url.toString();
    }

    return NextResponse.json({
      success: true,
      signedUrl: finalUrl,
      conversationId: session?.id || `practice_${Date.now()}`,
      sessionId: session?.id,
      config: {
        scenario,
        persona,
      },
    });
  } catch (error) {
    console.error('Practice start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
