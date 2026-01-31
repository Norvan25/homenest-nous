import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/debug-logger'

const scenarioPrompts: Record<string, string> = {
  // Email scenarios
  'follow-up-showing': `Write a follow-up email to a potential seller after a property showing. 
Be warm, professional, and reference specific details about the property if provided.
Include a clear next step or call to action.`,

  'listing-presentation': `Write an introduction email before a listing presentation meeting.
Establish credibility, show market knowledge, and build anticipation for the meeting.
Keep it professional but personable.`,

  'price-reduction': `Write an email to suggest a price reduction to a seller.
Be diplomatic, use market data to support the recommendation, and maintain the relationship.
Acknowledge their goals while being realistic about market conditions.`,

  'thank-you-closing': `Write a thank you email after successfully closing a deal.
Express genuine gratitude, celebrate the milestone, and ask for referrals naturally.
Make it memorable and relationship-building.`,

  // Letter scenarios
  'introduction': `Write a professional introduction letter for a real estate agent to potential clients.
Establish credibility, highlight experience, and invite them to connect.`,

  'listing-proposal': `Write a formal listing proposal letter to a potential seller.
Include value proposition, marketing plan overview, and clear next steps.`,

  'offer-letter': `Write a buyer offer letter that communicates the offer details professionally.
Be clear about terms while maintaining warmth.`,

  'market-update': `Write a market update letter informing clients about recent market changes.
Be informative, professional, and position yourself as a market expert.`,

  // SMS scenarios
  'appointment-reminder': `Write a brief, friendly SMS reminder for an upcoming appointment.
Keep it under 160 characters, include time confirmation.`,

  'showing-followup': `Write a quick SMS follow-up after a property showing.
Express thanks and gauge interest. Keep it under 160 characters.`,

  'new-listing': `Write a brief SMS alerting a buyer about a new listing that matches their criteria.
Create urgency while being informative. Under 160 characters.`,

  'price-update': `Write a short SMS informing a buyer about a price reduction.
Be exciting but professional. Under 160 characters.`,

  'quick-checkin': `Write a friendly check-in SMS to stay in touch with a lead.
Be casual and helpful. Under 160 characters.`,
}

export async function POST(request: NextRequest) {
  try {
    const { type, scenario_id, lead_id, context, custom_instruction } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        content: `[API Key Required]\n\nTo generate ${type}s, please configure your ANTHROPIC_API_KEY in environment variables.\n\nThis is a placeholder showing where your generated content would appear.`,
      })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    let leadContext = ''
    if (lead_id) {
      try {
        const { data: lead } = await (supabase.from('crm_leads') as any)
          .select(`
            *,
            properties (street_address, city, price, beds, baths),
            contacts (name)
          `)
          .eq('id', lead_id)
          .single()

        if (lead) {
          leadContext = `
LEAD CONTEXT:
- Name: ${lead.contacts?.name || 'Unknown'}
- Property: ${lead.properties?.street_address || 'Unknown'}, ${lead.properties?.city || ''}
- Price: $${lead.properties?.price?.toLocaleString() || 'Unknown'}
- Status: ${lead.status}
`
        }
      } catch (e) {
        // Lead lookup failed, continue without context
      }
    }

    // Handle context from letter/sms writers
    let additionalContext = ''
    if (context) {
      if (context.recipientName) additionalContext += `\nRecipient Name: ${context.recipientName}`
      if (context.propertyAddress) additionalContext += `\nProperty Address: ${context.propertyAddress}`
      if (context.customContext) additionalContext += `\nAdditional Context: ${context.customContext}`
    }

    const scenarioPrompt = scenarioPrompts[scenario_id] || `Write a professional real estate ${type}.`

    const typeInstructions: Record<string, string> = {
      email: 'Include a subject line at the top. Format professionally with greeting and signature.',
      letter: 'Format as a formal business letter with date, recipient address block, greeting, body paragraphs, and formal closing.',
      sms: 'Keep the message under 160 characters. Be concise and conversational.',
    }

    const systemPrompt = `You are an expert real estate copywriter helping agents communicate effectively.

Write in a professional, warm, and confident tone that reflects a top-performing real estate agent.

TASK: ${scenarioPrompt}

${typeInstructions[type] || ''}

${leadContext}
${additionalContext}

${custom_instruction ? `ADDITIONAL INSTRUCTION: ${custom_instruction}` : ''}

Generate only the ${type} content. Use [Name], [Address], or similar placeholders if specific details aren't provided.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: `Generate the ${type}.` }],
      system: systemPrompt,
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''

    // Log generation
    try {
      await (supabase.from('generated_documents') as any).insert({
        type,
        scenario: scenario_id,
        lead_id: lead_id || null,
        content,
      })
    } catch (e) {
      // Table might not exist yet
    }

    logger.info('Document generated', { type, scenario_id, lead_id }, 'nordosc')

    return NextResponse.json({ content })
  } catch (error) {
    logger.error('Document generation failed', error as Error, {}, 'nordosc')
    return NextResponse.json({ 
      content: 'Error generating content. Please check your API configuration.',
    }, { status: 500 })
  }
}
