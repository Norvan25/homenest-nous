import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('ElevenLabs webhook received:', JSON.stringify(body, null, 2));

    const { conversation_id, status, transcript, analysis, recording_url, metadata, duration_seconds } = body;

    if (!conversation_id) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    // Find queue item by conversation_id
    let queueItem = null;
    const { data: itemByConvId } = await supabase
      .from('call_queue')
      .select('*')
      .eq('conversation_id', conversation_id)
      .single();

    queueItem = itemByConvId;

    // Fallback: try metadata queue_item_id
    if (!queueItem && metadata?.queue_item_id) {
      const { data: itemByMeta } = await supabase
        .from('call_queue')
        .select('*')
        .eq('id', metadata.queue_item_id)
        .single();
      queueItem = itemByMeta;
    }

    if (!queueItem) {
      console.warn('Queue item not found for conversation:', conversation_id);
      return NextResponse.json({ received: true });
    }

    // Determine call outcome
    let callOutcome = 'completed';
    if (analysis?.outcome) {
      callOutcome = analysis.outcome.toLowerCase();
    } else if (status === 'failed') {
      callOutcome = 'failed';
    }

    // Format transcript
    const formattedTranscript = transcript
      ? transcript.map((t: { role: string; message: string }) => `${t.role}: ${t.message}`).join('\n')
      : null;

    // Update call_queue record
    await supabase
      .from('call_queue')
      .update({
        status: 'completed',
        call_ended_at: new Date().toISOString(),
        call_duration_seconds: duration_seconds || null,
        call_outcome: callOutcome,
        call_transcript: formattedTranscript,
        call_recording_url: recording_url || null,
      })
      .eq('id', queueItem.id);

    // Log activity to CRM
    if (queueItem.crm_lead_id) {
      await supabase.from('crm_activities').insert({
        crm_lead_id: queueItem.crm_lead_id,
        activity_type: 'call',
        outcome: callOutcome,
        notes: analysis?.summary || `AI call completed. Duration: ${duration_seconds}s`,
      });

      // Update last activity date on lead
      await supabase
        .from('crm_leads')
        .update({ last_activity_date: new Date().toISOString() })
        .eq('id', queueItem.crm_lead_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
