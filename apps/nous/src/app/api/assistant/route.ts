import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Create Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Fallback KB content if Supabase table doesn't exist yet
const FALLBACK_KB = `
## HomeNest Nous Overview
HomeNest Nous is a real estate lead management platform with two main modules:
- **NorLead**: Find and manage seller leads from expired listings
- **NorCRM**: Track and nurture leads through your sales pipeline

## Adding Leads to CRM
To add leads to your CRM:
1. Go to NorLead from the sidebar
2. Browse properties and expand them to see contacts
3. Select phones and emails you want to work with (click to toggle selection)
4. Click "Transfer to NorCRM" in the selection bar
5. Your leads will appear in NorCRM ready for follow-up

## What is DNC?
DNC stands for "Do Not Call". When a phone number is marked as DNC:
- It cannot be selected for campaigns
- It appears grayed out with a red DNC badge
- This helps you stay compliant with regulations

To mark a phone as DNC:
1. Hover over the phone number
2. Click the ban icon that appears
3. Confirm the action

## Logging Calls
To log a call in NorCRM:
1. Click on a lead to open the detail panel
2. Click "Log Call" button
3. Select the outcome (Answered, Voicemail, No Answer, etc.)
4. If answered, select the result (Interested, Callback, etc.)
5. Add any notes
6. Click "Save Call"

## Editing Properties
To edit a property in NorLead:
1. Find the property card
2. Click the three-dot menu (⋮) on the right
3. Select "Edit Property"
4. Update the fields (address, price, beds, etc.)
5. Click "Save Changes"

## Managing Contacts
Each property can have multiple contacts. You can:
- **Add Contact**: Click menu → Add Contact
- **Edit Contact**: Click contact menu → Edit Contact
- **Delete Contact**: Click contact menu → Delete Contact
- **Add Phone/Email**: Use the contact menu options

## Lead Statuses in NorCRM
- **New**: Just transferred, needs first contact
- **Contacted**: You've reached out at least once
- **Interested**: Lead showed interest
- **Appointment**: Meeting scheduled
- **Closed**: Deal completed
- **Dead**: Not pursuing further

## Priority Levels
- **Hot** 🔥: High priority, needs immediate attention
- **Normal**: Standard follow-up schedule
- **Low**: Lower priority leads

## Bulk Actions
When you have items selected:
- **Mark DNC**: Mark all selected phones as Do Not Call
- **Delete**: Remove selected properties
- **Transfer**: Send to CRM for follow-up

In NorCRM with leads selected:
- **Change Status**: Update all selected leads
- **Change Priority**: Set priority for batch
- **Remove from CRM**: Keep in NorLead, remove from CRM
`

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, history } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Try to load KB content from Supabase
    let kbText = FALLBACK_KB
    
    try {
      const { data: kbContent, error: kbError } = await supabase
        .from('nous_kb')
        .select('section, title, content')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (!kbError && kbContent && kbContent.length > 0) {
        kbText = kbContent
          .map(kb => `## ${kb.title}\n\n${kb.content}`)
          .join('\n\n---\n\n')
      }
    } catch (e) {
      // Use fallback KB if table doesn't exist
      console.log('Using fallback KB content')
    }

    const systemPrompt = `You are the Nous Assistant, a helpful AI that guides users through the HomeNest Nous real estate platform.

## YOUR KNOWLEDGE BASE

${kbText}

## INSTRUCTIONS

1. Answer questions based on the knowledge base above
2. Be concise and helpful - users are busy real estate agents
3. Use bullet points for multi-step instructions
4. If you don't know something, say so honestly and suggest they contact support
5. Suggest related features when relevant
6. Keep responses under 200 words unless explaining a complex workflow
7. Use markdown formatting for clarity (bold, bullets, etc.)

## TONE

- Professional but friendly
- Direct and actionable
- Encouraging but not cheesy
- Like a helpful colleague who knows the system well`

    // Build messages array with history
    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: { role: string; content: string }) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })
        }
      })
    }
    
    messages.push({ role: 'user', content: message })

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    })

    const assistantResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Sorry, I could not generate a response.'

    // Try to save to chat history (non-blocking)
    let assistantChatId = null
    try {
      // Save user message
      await supabase
        .from('assistant_chats')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: message,
        })

      // Save assistant response
      const { data: assistantChat } = await supabase
        .from('assistant_chats')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: assistantResponse,
          tokens_used: response.usage?.output_tokens || 0,
        })
        .select('id')
        .single()

      assistantChatId = assistantChat?.id
    } catch (e) {
      // Chat history tables may not exist, continue anyway
      console.log('Could not save chat history:', e)
    }

    return NextResponse.json({
      response: assistantResponse,
      chatId: assistantChatId,
    })

  } catch (error) {
    console.error('Assistant API error:', error)
    
    // Return more specific error messages
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error: ${error.message}` },
        { status: error.status || 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
