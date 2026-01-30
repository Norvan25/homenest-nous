import { NextRequest, NextResponse } from 'next/server';
import { getElevenLabs } from '@/lib/elevenlabs';

export async function GET() {
  try {
    const elevenlabs = getElevenLabs();
    const result = await elevenlabs.listAgents();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing agents:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, prompt, firstMessage, voiceId } = body;

    if (!name || !prompt || !firstMessage || !voiceId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, prompt, firstMessage, voiceId' },
        { status: 400 }
      );
    }

    const elevenlabs = getElevenLabs();
    const agent = await elevenlabs.createAgent({ name, prompt, firstMessage, voiceId });
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
