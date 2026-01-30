import { NextResponse } from 'next/server';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Try multiple possible endpoints to find the right one
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key' });
  }

  const results: Record<string, any> = {};

  const endpoints = [
    '/convai/agents',
    '/convai/phone-numbers',
    '/convai/twilio/phone-numbers', 
    '/phone-numbers',
    '/convai/conversation',
    '/convai/twilio/phone_numbers',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}${endpoint}`, {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
      
      const text = await response.text();
      results[endpoint] = {
        status: response.status,
        ok: response.ok,
        body: text.substring(0, 500),
      };
    } catch (error: any) {
      results[endpoint] = { error: error.message };
    }
  }

  return NextResponse.json({ 
    apiKeyPrefix: apiKey.substring(0, 15) + '...',
    endpoints: results 
  });
}

// Test a specific outbound call
export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const body = await request.json();
  const { agentId, phoneNumber } = body;
  const fromNumber = process.env.ELEVENLABS_FROM_PHONE_NUMBER || '+19182333941';

  if (!apiKey || !agentId || !phoneNumber) {
    return NextResponse.json({ error: 'Missing apiKey, agentId, or phoneNumber' });
  }

  // Format phone to E.164
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return phone.startsWith('+') ? phone : `+${digits}`;
  };

  const toNumber = formatPhone(phoneNumber);

  // Get phone number ID from env or we need to fetch it
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

  // Try multiple endpoint variations with different parameter names
  const endpointsToTry = [
    {
      url: '/convai/twilio/outbound_call',
      body: {
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        to_number: toNumber,
      }
    },
    {
      url: '/convai/twilio/outbound_call',
      body: {
        agent_id: agentId,
        phone_number_id: phoneNumberId,
        to_number: toNumber,
      }
    },
    {
      url: '/convai/conversation/outbound_call',
      body: {
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        to_number: toNumber,
      }
    },
  ];

  const results: Record<string, any> = {};

  for (const endpoint of endpointsToTry) {
    try {
      console.log(`Trying: POST ${endpoint.url}`);
      console.log(`Body: ${JSON.stringify(endpoint.body)}`);
      
      const response = await fetch(`${ELEVENLABS_API_URL}${endpoint.url}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endpoint.body),
      });
      
      const text = await response.text();
      results[endpoint.url] = {
        status: response.status,
        ok: response.ok,
        body: text.substring(0, 1000),
      };
      
      // If we found a working endpoint, return immediately
      if (response.ok) {
        return NextResponse.json({
          success: true,
          workingEndpoint: endpoint.url,
          response: JSON.parse(text),
        });
      }
    } catch (error: any) {
      results[endpoint.url] = { error: error.message };
    }
  }

  return NextResponse.json({ 
    success: false,
    message: 'No working endpoint found',
    results 
  });
}
