import { NextRequest, NextResponse } from 'next/server';
import { getElevenLabs } from '@/lib/elevenlabs';

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const elevenlabs = getElevenLabs();
    const result = await elevenlabs.listConversations(params.agentId, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing conversations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
