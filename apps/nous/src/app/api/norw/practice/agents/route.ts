import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/norw/practice/agents
 * 
 * Returns only the ElevenLabs agents configured for NorW practice mode.
 * Agent IDs are stored in NORW_PRACTICE_AGENT_IDS environment variable.
 * 
 * Format: comma-separated agent IDs
 * Example: NORW_PRACTICE_AGENT_IDS=agent_xxx,agent_yyy,agent_zzz
 */

interface PracticeAgent {
  agent_id: string;
  name: string;
  description?: string;
  persona_type?: string;
}

// Practice agent configurations - maps agent IDs to metadata
// This allows us to add friendly names and descriptions for each practice agent
const PRACTICE_AGENT_CONFIGS: Record<string, { name: string; description: string; persona_type: string }> = {
  // Add your practice agent IDs and their display info here
  // These will be merged with the actual agent data from ElevenLabs
  // Example:
  // 'agent_xxx': { name: 'The Skeptic', description: 'Questions everything you say', persona_type: 'skeptic' },
};

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'ELEVENLABS_API_KEY not configured',
        agents: [],
      });
    }

    // Get allowed practice agent IDs from environment
    const allowedAgentIds = process.env.NORW_PRACTICE_AGENT_IDS?.split(',').map(id => id.trim()).filter(Boolean) || [];
    
    if (allowedAgentIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No practice agents configured. Add NORW_PRACTICE_AGENT_IDS to .env.local',
        agents: [],
      });
    }

    // Fetch all agents from ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `ElevenLabs API error: ${response.status}`,
        agents: [],
      });
    }

    const data = await response.json();
    const allAgents = data.agents || [];

    // Filter to only allowed practice agents
    const practiceAgents: PracticeAgent[] = allAgents
      .filter((agent: any) => allowedAgentIds.includes(agent.agent_id))
      .map((agent: any) => {
        // Merge with our local config if available
        const config = PRACTICE_AGENT_CONFIGS[agent.agent_id];
        
        return {
          agent_id: agent.agent_id,
          name: config?.name || agent.name || 'Practice Agent',
          description: config?.description || agent.conversation_config?.agent?.prompt?.substring(0, 100) || '',
          persona_type: config?.persona_type || 'default',
        };
      });

    // Sort by name
    practiceAgents.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      agents: practiceAgents,
      configured_ids: allowedAgentIds,
      found_count: practiceAgents.length,
    });
  } catch (error) {
    console.error('Error fetching practice agents:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      agents: [],
    }, { status: 500 });
  }
}
