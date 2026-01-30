import { NextRequest, NextResponse } from 'next/server';
import { getElevenLabs } from '@/lib/elevenlabs';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const elevenlabs = getElevenLabs();
    const conversation = await elevenlabs.getConversation(params.conversationId);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
