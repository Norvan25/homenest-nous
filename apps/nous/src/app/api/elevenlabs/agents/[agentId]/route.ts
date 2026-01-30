import { NextRequest, NextResponse } from 'next/server';
import { getElevenLabs } from '@/lib/elevenlabs';

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const elevenlabs = getElevenLabs();
    const agent = await elevenlabs.getAgent(params.agentId);
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error getting agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const body = await request.json();
    const elevenlabs = getElevenLabs();
    const agent = await elevenlabs.updateAgent(params.agentId, body);
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const elevenlabs = getElevenLabs();
    await elevenlabs.deleteAgent(params.agentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
