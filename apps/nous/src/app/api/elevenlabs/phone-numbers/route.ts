import { NextResponse } from 'next/server';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key' }, { status: 500 });
  }

  // Try different endpoints to find phone numbers
  const endpoints = [
    '/convai/phone-numbers',
    '/convai/twilio/phone-numbers',
    '/convai/twilio/phone_numbers',
    '/phone-numbers',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}${endpoint}`, {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          endpoint,
          data,
        });
      }
    } catch (error) {
      // Continue to next endpoint
    }
  }

  return NextResponse.json({ 
    error: 'Could not find phone numbers endpoint',
    hint: 'You may need to get the phone_number_id from ElevenLabs dashboard'
  });
}
