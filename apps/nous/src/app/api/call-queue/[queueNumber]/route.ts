import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { queueNumber: string } }
) {
  try {
    const queueNumber = parseInt(params.queueNumber);
    
    if (isNaN(queueNumber) || queueNumber < 1 || queueNumber > 4) {
      return NextResponse.json({ error: 'Invalid queue number' }, { status: 400 });
    }

    // Get queue items
    const { data: items, error: itemsError } = await supabase
      .from('call_queue')
      .select('*')
      .eq('queue_number', queueNumber)
      .order('position', { ascending: true });

    if (itemsError) throw itemsError;

    // Get queue settings
    const { data: settings, error: settingsError } = await supabase
      .from('call_queue_settings')
      .select('*')
      .eq('queue_number', queueNumber)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

    // Calculate stats
    const stats = {
      total: items?.length || 0,
      pending: items?.filter(i => i.status === 'queued').length || 0,
      completed: items?.filter(i => ['completed', 'no_answer', 'voicemail_left', 'failed'].includes(i.status)).length || 0,
      inProgress: items?.filter(i => i.status === 'calling').length || 0,
    };

    return NextResponse.json({
      queueNumber,
      items: items || [],
      settings: settings || {
        agent_id: null,
        voice_id: null,
        is_running: false,
        is_paused: false,
        call_interval_seconds: 30,
        schedule_start: null,
        schedule_end: null,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { queueNumber: string } }
) {
  try {
    const queueNumber = parseInt(params.queueNumber);

    if (isNaN(queueNumber) || queueNumber < 1 || queueNumber > 4) {
      return NextResponse.json({ error: 'Invalid queue number' }, { status: 400 });
    }

    // Clear all items in this queue
    const { error } = await supabase
      .from('call_queue')
      .delete()
      .eq('queue_number', queueNumber);

    if (error) throw error;

    // Reset queue settings
    await supabase
      .from('call_queue_settings')
      .update({
        is_running: false,
        is_paused: false,
      })
      .eq('queue_number', queueNumber);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
