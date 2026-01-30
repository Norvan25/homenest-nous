import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Get call/conversation status
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `${ELEVENLABS_API_URL}/convai/conversations/${params.conversationId}`,
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - End/terminate a call
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log(`[ElevenLabs] Ending call: ${params.conversationId}`);

    // Try to end the call via ElevenLabs API
    const response = await fetch(
      `${ELEVENLABS_API_URL}/convai/conversations/${params.conversationId}`,
      {
        method: 'DELETE',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update queue item status regardless of API response
    await supabase
      .from('call_queue')
      .update({
        status: 'cancelled',
        call_ended_at: new Date().toISOString(),
        call_outcome: 'cancelled_by_user',
      })
      .eq('conversation_id', params.conversationId);

    if (!response.ok) {
      const error = await response.text();
      console.log(`[ElevenLabs] End call response: ${response.status} - ${error}`);
      // Still return success if we updated our DB
      return NextResponse.json({ 
        success: true, 
        note: 'Call marked as cancelled in DB',
        apiResponse: error 
      });
    }

    return NextResponse.json({ success: true, message: 'Call ended' });
  } catch (error: any) {
    console.error('Error ending call:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
