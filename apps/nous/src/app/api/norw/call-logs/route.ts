import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getElevenLabs } from '@/lib/elevenlabs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// HomeNest agent IDs - stored in env or database
const HOMENEST_AGENT_IDS = process.env.HOMENEST_AGENT_IDS?.split(',') || [];

interface CallLog {
  id: string;
  agentId: string;
  agentName: string;
  phoneNumber: string;
  contactName: string;
  duration: number;
  status: string;
  outcome: string;
  transcript: Array<{ role: string; message: string }>;
  recordingUrl?: string;
  createdAt: string;
  analysis?: any;
}

// GET - Fetch call logs from ElevenLabs for HomeNest agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const elevenlabs = getElevenLabs();

    // First, get list of HomeNest agents
    let agentIds: string[] = [];
    
    if (agentId) {
      // If specific agent requested, verify it's a HomeNest agent
      agentIds = [agentId];
    } else {
      // Get all HomeNest agents from database or env
      const { data: agents } = await supabase
        .from('homenest_agents')
        .select('elevenlabs_agent_id');
      
      if (agents && agents.length > 0) {
        agentIds = agents.map(a => a.elevenlabs_agent_id);
      } else if (HOMENEST_AGENT_IDS.length > 0) {
        agentIds = HOMENEST_AGENT_IDS;
      } else {
        // Fallback: fetch all agents from ElevenLabs and filter
        const allAgents = await elevenlabs.listAgents();
        // Filter agents that belong to HomeNest (by name pattern or metadata)
        agentIds = allAgents.agents
          ?.filter((a: any) => 
            a.name?.toLowerCase().includes('homenest') || 
            a.name?.toLowerCase().includes('norw') ||
            a.metadata?.organization === 'homenest'
          )
          .map((a: any) => a.agent_id) || [];
      }
    }

    if (agentIds.length === 0) {
      return NextResponse.json({
        success: true,
        callLogs: [],
        agents: [],
        message: 'No HomeNest agents found',
      });
    }

    // Fetch conversations for each agent
    const allCallLogs: CallLog[] = [];
    const agentDetails: Record<string, any> = {};

    for (const agentIdToFetch of agentIds) {
      try {
        // Get agent details
        const agent = await elevenlabs.getAgent(agentIdToFetch);
        agentDetails[agentIdToFetch] = agent;

        // Get conversations for this agent
        const conversationsResponse = await elevenlabs.listConversations(agentIdToFetch);
        const conversations = conversationsResponse?.conversations || [];

        if (conversations.length > 0) {
          for (const conv of conversations) {
            // Apply date filters
            const convDate = new Date(conv.created_at || conv.start_time);
            if (dateFrom && convDate < new Date(dateFrom)) continue;
            if (dateTo && convDate > new Date(dateTo)) continue;

            // Get full conversation details with transcript
            let fullConv = conv;
            if (conv.conversation_id) {
              try {
                fullConv = await elevenlabs.getConversation(conv.conversation_id);
              } catch (e) {
                console.warn(`Could not fetch full conversation ${conv.conversation_id}`);
              }
            }

            allCallLogs.push({
              id: conv.conversation_id || conv.id,
              agentId: agentIdToFetch,
              agentName: agent.name || 'Unknown Agent',
              phoneNumber: fullConv.metadata?.to_number || conv.phone_number || 'Unknown',
              contactName: fullConv.metadata?.contact_name || 'Unknown',
              duration: fullConv.duration_seconds || conv.duration || 0,
              status: fullConv.status || conv.status || 'completed',
              outcome: fullConv.analysis?.outcome || 'unknown',
              transcript: parseTranscript(fullConv.transcript || fullConv.messages || []),
              recordingUrl: fullConv.recording_url,
              createdAt: convDate.toISOString(),
            });
          }
        }
      } catch (agentError) {
        console.error(`Error fetching data for agent ${agentIdToFetch}:`, agentError);
      }
    }

    // Sort by date descending
    allCallLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedLogs = allCallLogs.slice(offset, offset + limit);

    // Get unique agents for the filter dropdown
    const uniqueAgents = Object.entries(agentDetails).map(([id, agent]: [string, any]) => ({
      id,
      name: agent.name || 'Unknown',
    }));

    return NextResponse.json({
      success: true,
      callLogs: paginatedLogs,
      agents: uniqueAgents,
      total: allCallLogs.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Parse/analyze a specific call log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, analyzeWithClaude = false } = body;

    const elevenlabs = getElevenLabs();

    // Fetch the conversation
    const conversation = await elevenlabs.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const transcript = parseTranscript(conversation.transcript || conversation.messages || []);

    let analysis = null;

    // Optionally analyze with Claude
    if (analyzeWithClaude && transcript.length > 0) {
      const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/norw/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        analysis = analysisData.analysis;
      }
    }

    // Save to database for future reference
    const { error: saveError } = await supabase
      .from('norw_call_logs')
      .upsert({
        conversation_id: conversationId,
        agent_id: conversation.agent_id,
        phone_number: conversation.metadata?.to_number,
        contact_name: conversation.metadata?.contact_name,
        duration_seconds: conversation.duration_seconds,
        status: conversation.status,
        outcome: conversation.analysis?.outcome,
        transcript,
        recording_url: conversation.recording_url,
        analysis,
        created_at: conversation.created_at || new Date().toISOString(),
        parsed_at: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id',
      });

    if (saveError) {
      console.error('Error saving call log:', saveError);
    }

    return NextResponse.json({
      success: true,
      callLog: {
        id: conversationId,
        agentId: conversation.agent_id,
        phoneNumber: conversation.metadata?.to_number,
        contactName: conversation.metadata?.contact_name,
        duration: conversation.duration_seconds,
        status: conversation.status,
        outcome: conversation.analysis?.outcome,
        transcript,
        recordingUrl: conversation.recording_url,
        createdAt: conversation.created_at,
        analysis,
      },
    });
  } catch (error) {
    console.error('Error parsing call log:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function parseTranscript(raw: any[]): Array<{ role: string; message: string; timestamp?: number }> {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((entry, index) => {
    // Handle different transcript formats from ElevenLabs
    if (typeof entry === 'string') {
      // Simple string format
      const isAgent = entry.toLowerCase().startsWith('agent:') || 
                      entry.toLowerCase().startsWith('assistant:');
      return {
        role: isAgent ? 'agent' : 'homeowner',
        message: entry.replace(/^(agent|assistant|user|homeowner):\s*/i, ''),
        timestamp: index * 5, // Estimate timestamp
      };
    }

    // Object format
    const role = entry.role === 'assistant' || entry.role === 'agent' ? 'agent' : 'homeowner';
    return {
      role,
      message: entry.message || entry.content || entry.text || '',
      timestamp: entry.timestamp || entry.time || index * 5,
    };
  }).filter(entry => entry.message.trim().length > 0);
}
