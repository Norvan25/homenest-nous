import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueNumber, ...settings } = body;

    if (!queueNumber || queueNumber < 1 || queueNumber > 4) {
      return NextResponse.json({ error: 'Invalid queue number' }, { status: 400 });
    }

    // Check if settings row exists
    const { data: existing } = await supabase
      .from('call_queue_settings')
      .select('id')
      .eq('queue_number', queueNumber)
      .single();

    let result;
    if (existing) {
      // Update existing
      result = await supabase
        .from('call_queue_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('queue_number', queueNumber)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from('call_queue_settings')
        .insert({
          queue_number: queueNumber,
          ...settings,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating queue settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
