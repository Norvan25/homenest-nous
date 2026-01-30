import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getElevenLabs } from '@/lib/elevenlabs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueNumber } = body;

    if (!queueNumber || queueNumber < 1 || queueNumber > 4) {
      return NextResponse.json({ error: 'Invalid queue number' }, { status: 400 });
    }

    // Get queue settings
    const { data: settings, error: settingsError } = await supabase
      .from('call_queue_settings')
      .select('*')
      .eq('queue_number', queueNumber)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    if (!settings?.agent_id) {
      return NextResponse.json({ error: 'No agent selected for this queue' }, { status: 400 });
    }

    // Check if within schedule window
    if (settings.schedule_start && settings.schedule_end) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime < settings.schedule_start || currentTime > settings.schedule_end) {
        return NextResponse.json({ 
          error: `Outside calling window (${settings.schedule_start} - ${settings.schedule_end})` 
        }, { status: 400 });
      }
    }

    // Mark queue as running
    await supabase
      .from('call_queue_settings')
      .update({ is_running: true, is_paused: false })
      .eq('queue_number', queueNumber);

    // Get next pending item
    const { data: nextItem, error: itemError } = await supabase
      .from('call_queue')
      .select('*')
      .eq('queue_number', queueNumber)
      .eq('status', 'queued')
      .order('position', { ascending: true })
      .limit(1)
      .single();

    if (itemError || !nextItem) {
      // No more items, mark queue as complete
      await supabase
        .from('call_queue_settings')
        .update({ is_running: false })
        .eq('queue_number', queueNumber);
      
      return NextResponse.json({ message: 'No pending items in queue' });
    }

    // Update item status to calling
    await supabase
      .from('call_queue')
      .update({ status: 'calling', call_started_at: new Date().toISOString() })
      .eq('id', nextItem.id);

    // Prepare dynamic variables
    const dynamicVariables: Record<string, string> = {
      homeowner_name: nextItem.contact_name || 'there',
      property_address: nextItem.property_address || 'your property',
    };

    if (nextItem.property_city) {
      dynamicVariables.property_city = nextItem.property_city;
    }
    if (nextItem.days_on_market) {
      dynamicVariables.days_on_market = String(nextItem.days_on_market);
    }
    if (nextItem.list_price) {
      dynamicVariables.list_price = String(nextItem.list_price);
    }

    // Metadata for webhook tracking
    const metadata: Record<string, string> = {
      queue_item_id: nextItem.id,
      queue_number: String(queueNumber),
      contact_name: nextItem.contact_name || '',
      property_address: nextItem.property_address || '',
    };

    if (settings.voice_id) {
      metadata.voice_override = settings.voice_id;
    }

    // Initiate call via ElevenLabs
    const elevenlabs = getElevenLabs();
    const result = await elevenlabs.initiateCall(
      settings.agent_id,
      nextItem.phone_number,
      metadata,
      dynamicVariables
    );

    // Store conversation ID
    await supabase
      .from('call_queue')
      .update({ conversation_id: result.conversation_id })
      .eq('id', nextItem.id);

    return NextResponse.json({
      success: true,
      conversationId: result.conversation_id,
      queueNumber,
      itemId: nextItem.id,
    });
  } catch (error) {
    console.error('Error starting queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
