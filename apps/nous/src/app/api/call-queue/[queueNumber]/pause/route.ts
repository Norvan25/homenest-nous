import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { queueNumber: string } }
) {
  try {
    const queueNumber = parseInt(params.queueNumber);

    if (isNaN(queueNumber) || queueNumber < 1 || queueNumber > 4) {
      return NextResponse.json({ error: 'Invalid queue number' }, { status: 400 });
    }

    // Toggle pause state
    const { data: currentSettings } = await supabase
      .from('call_queue_settings')
      .select('is_paused')
      .eq('queue_number', queueNumber)
      .single();

    const { error } = await supabase
      .from('call_queue_settings')
      .update({
        is_paused: !currentSettings?.is_paused,
        updated_at: new Date().toISOString(),
      })
      .eq('queue_number', queueNumber);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      is_paused: !currentSettings?.is_paused 
    });
  } catch (error) {
    console.error('Error pausing queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
