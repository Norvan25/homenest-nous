import { NextRequest, NextResponse } from 'next/server';
import { getElevenLabs } from '@/lib/elevenlabs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  let queueItemId: string | undefined;
  const debugLog: string[] = [];
  
  const log = (msg: string) => {
    console.log(`[CALL DEBUG] ${msg}`);
    debugLog.push(`${new Date().toISOString()}: ${msg}`);
  };
  
  try {
    log('=== CALL INITIATION STARTED ===');
    
    const body = await request.json();
    log(`Request body: ${JSON.stringify(body)}`);
    
    queueItemId = body.queueItemId;
    const { agentId } = body;

    if (!queueItemId) {
      log('ERROR: Missing queueItemId');
      return NextResponse.json(
        { error: 'Missing queueItemId', debug: debugLog },
        { status: 400 }
      );
    }
    
    if (!agentId) {
      log('ERROR: Missing agentId');
      return NextResponse.json(
        { error: 'Missing agentId', debug: debugLog },
        { status: 400 }
      );
    }

    log(`QueueItemId: ${queueItemId}`);
    log(`AgentId: ${agentId}`);

    // Fetch queue item with all context
    log('Fetching queue item from database...');
    const { data: queueItem, error: fetchError } = await supabase
      .from('call_queue')
      .select('*')
      .eq('id', queueItemId)
      .single();

    if (fetchError) {
      log(`ERROR fetching queue item: ${fetchError.message}`);
      return NextResponse.json({ 
        error: 'Queue item not found', 
        details: fetchError.message,
        debug: debugLog 
      }, { status: 404 });
    }
    
    if (!queueItem) {
      log('ERROR: Queue item is null');
      return NextResponse.json({ 
        error: 'Queue item not found',
        debug: debugLog 
      }, { status: 404 });
    }

    log(`Queue item found: ${JSON.stringify(queueItem)}`);

    if (!queueItem.phone_number) {
      log('ERROR: No phone number in queue item');
      return NextResponse.json({ 
        error: 'No phone number for this queue item',
        debug: debugLog 
      }, { status: 400 });
    }

    log(`Phone number: ${queueItem.phone_number}`);

    // Update status to calling
    log('Updating queue item status to "calling"...');
    const { error: updateError } = await supabase
      .from('call_queue')
      .update({ 
        status: 'calling', 
        call_started_at: new Date().toISOString() 
      })
      .eq('id', queueItemId);
    
    if (updateError) {
      log(`WARNING: Failed to update status: ${updateError.message}`);
    } else {
      log('Status updated to "calling"');
    }

    // Prepare dynamic variables for personalization
    const dynamicVariables: Record<string, string> = {
      homeowner_name: queueItem.contact_name || 'there',
      property_address: queueItem.property_address || 'your property',
    };

    if (queueItem.property_city) {
      dynamicVariables.property_city = queueItem.property_city;
    }
    if (queueItem.days_on_market) {
      dynamicVariables.days_on_market = String(queueItem.days_on_market);
    }
    if (queueItem.list_price) {
      dynamicVariables.list_price = String(queueItem.list_price);
    }

    log(`Dynamic variables: ${JSON.stringify(dynamicVariables)}`);

    // Metadata for webhook tracking
    const metadata: Record<string, string> = {
      queue_item_id: queueItemId,
      contact_name: queueItem.contact_name || '',
      property_address: queueItem.property_address || '',
    };

    log(`Metadata: ${JSON.stringify(metadata)}`);

    // Check if ElevenLabs API key is configured
    log('Checking ElevenLabs API key...');
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      log('ERROR: ELEVENLABS_API_KEY not configured');
      return NextResponse.json({ 
        error: 'ELEVENLABS_API_KEY not configured',
        debug: debugLog 
      }, { status: 500 });
    }
    log(`API key present: ${apiKey.substring(0, 10)}...`);

    // Initiate call via ElevenLabs with dynamic variables
    log('Getting ElevenLabs client...');
    const elevenlabs = getElevenLabs();
    
    log('Initiating call to ElevenLabs API...');
    log(`Calling: agentId=${agentId}, phone=${queueItem.phone_number}`);
    
    const result = await elevenlabs.initiateCall(
      agentId,
      queueItem.phone_number,
      metadata,
      dynamicVariables
    );

    log(`ElevenLabs response: ${JSON.stringify(result)}`);

    if (!result.conversation_id) {
      log('ERROR: No conversation_id in response');
      return NextResponse.json({ 
        error: 'No conversation_id returned from ElevenLabs',
        debug: debugLog 
      }, { status: 500 });
    }

    // Store conversation ID
    log(`Storing conversation_id: ${result.conversation_id}`);
    await supabase
      .from('call_queue')
      .update({ conversation_id: result.conversation_id })
      .eq('id', queueItemId);

    log('=== CALL INITIATED SUCCESSFULLY ===');

    return NextResponse.json({ 
      success: true, 
      conversationId: result.conversation_id,
      dynamicVariables,
      debug: debugLog
    });
  } catch (error: any) {
    log(`EXCEPTION: ${error.message}`);
    log(`Stack: ${error.stack}`);
    
    console.error('Error initiating call:', error);
    
    // Reset status if call failed to initiate
    if (queueItemId) {
      log('Resetting queue item status to "queued"...');
      await supabase
        .from('call_queue')
        .update({ status: 'queued', call_started_at: null })
        .eq('id', queueItemId);
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        debug: debugLog
      },
      { status: 500 }
    );
  }
}

// GET endpoint to test the call API
export async function GET() {
  const debugInfo = {
    elevenlabs_api_key_set: !!process.env.ELEVENLABS_API_KEY,
    supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  
  return NextResponse.json({ 
    status: 'Call API is ready',
    config: debugInfo
  });
}
