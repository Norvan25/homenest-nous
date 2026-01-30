import { NextResponse } from 'next/server';
import { getElevenLabs } from '@/lib/elevenlabs';

export async function GET() {
  try {
    const elevenlabs = getElevenLabs();
    const result = await elevenlabs.listVoices();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing voices:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
