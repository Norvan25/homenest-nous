import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/debug-logger'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  logger.setRequestId(requestId)

  try {
    const { type, scenario_id, lead_id, custom_instruction, context } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        content: `[API Key Required]\n\nTo generate ${type}s, please configure your ANTHROPIC_API_KEY in environment variables.`,
      })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // 1. Fetch scenario prompt from database (NOT hardcoded)
    const { data: scenario, error: scenarioError } = await (supabase
      .from('document_scenarios') as any)
      .select('id, name, prompt_template, version')
      .eq('id', scenario_id)
      .eq('is_active', true)
      .single()

    let promptTemplate = ''
    let promptVersion = '1.0'

    if (scenarioError || !scenario) {
      // Fallback to default prompts if table doesn't exist or scenario not found
      logger.warn('Scenario not found in DB, using fallback', { scenario_id }, 'nordosc')
      promptTemplate = getDefaultPrompt(type, scenario_id)
      promptVersion = 'fallback-1.0'
    } else {
      promptTemplate = scenario.prompt_template
      promptVersion = scenario.version
      logger.info('Using prompt from DB', { scenario_id, version: scenario.version }, 'nordosc')
    }

    // 2. Fetch user style profile (optional)
    let styleContext = ''
    try {
      const { data: style } = await (supabase
        .from('user_style_profile') as any)
        .select('tone, patterns, preferences')
        .single()

      if (style) {
        styleContext = `
USER WRITING STYLE:
- Tone: ${style.tone || 'professional'}
- Patterns: ${JSON.stringify(style.patterns || {})}
`
      }
    } catch (e) {
      // Style profile not available
    }

    // 3. Fetch lead context (optional)
    let leadContext = ''
    if (lead_id) {
      try {
        const { data: lead } = await (supabase
          .from('crm_leads') as any)
          .select(`
            id,
            status,
            notes,
            properties (
              street_address,
              city,
              state,
              zip,
              price,
              beds,
              baths,
              sqft,
              dom
            ),
            contacts (
              name
            )
          `)
          .eq('id', lead_id)
          .single()

        if (lead) {
          const p = Array.isArray(lead.properties) ? lead.properties[0] : lead.properties
          const c = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
          leadContext = `
LEAD CONTEXT:
- Contact Name: ${c?.name || 'Unknown'}
- Property: ${p?.street_address || 'Unknown'}, ${p?.city || ''} ${p?.state || ''}
- Price: ${p?.price ? '$' + p.price.toLocaleString() : 'Unknown'}
- Details: ${p?.beds || '?'} bed, ${p?.baths || '?'} bath, ${p?.sqft ? p.sqft.toLocaleString() + ' sqft' : ''}
- Days on Market: ${p?.dom || 'Unknown'}
- Lead Status: ${lead.status}
${lead.notes ? '- Notes: ' + lead.notes : ''}
`
        }
      } catch (e) {
        // Lead lookup failed
      }
    }

    // Handle context from letter/sms writers
    let additionalContext = ''
    if (context) {
      if (context.recipientName) additionalContext += `\nRecipient Name: ${context.recipientName}`
      if (context.propertyAddress) additionalContext += `\nProperty Address: ${context.propertyAddress}`
      if (context.customContext) additionalContext += `\nAdditional Context: ${context.customContext}`
    }

    // 4. Build system prompt
    const typeInstructions: Record<string, string> = {
      email: 'Include "Subject:" line at the top. Format professionally with greeting and signature.',
      letter: 'Format as a formal business letter with date, recipient address block, greeting, body paragraphs, and formal closing.',
      sms: 'Keep the message under 160 characters. Be concise and conversational.',
    }

    const systemPrompt = `You are an expert real estate copywriter helping agents communicate effectively.

${styleContext}

TASK:
${promptTemplate}

${typeInstructions[type] || ''}

${leadContext}
${additionalContext}

${custom_instruction ? `ADDITIONAL INSTRUCTIONS:\n${custom_instruction}` : ''}

OUTPUT FORMAT:
- For emails: Include "Subject:" line at the top
- Use [Name], [Address] style placeholders only if specific data not provided
- Keep appropriate length for the document type
`

    // 5. Generate with Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Generate the ${type} now.` }],
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''

    // 6. Save to generated_documents with prompt version tracking
    let savedDocId: string | null = null
    try {
      const { data: savedDoc, error: saveError } = await (supabase
        .from('generated_documents') as any)
        .insert({
          type,
          scenario: scenario_id,
          lead_id: lead_id || null,
          content,
          prompt_version: promptVersion,
          metadata: {
            custom_instruction,
            had_style_profile: !!styleContext,
            had_lead_context: !!leadContext,
          },
        })
        .select('id')
        .single()

      if (saveError) {
        logger.warn('Failed to save document', { error: saveError }, 'nordosc')
      } else {
        savedDocId = savedDoc?.id
      }
    } catch (e) {
      // Table might not exist yet
    }

    logger.info('Document generated', { 
      scenario_id, 
      doc_id: savedDocId,
      content_length: content.length,
      prompt_version: promptVersion
    }, 'nordosc')

    return NextResponse.json({ 
      content, 
      document_id: savedDocId,
      prompt_version: promptVersion 
    })

  } catch (error) {
    logger.error('Generation failed', error as Error, {}, 'nordosc')
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 })
  }
}

// Fallback prompts when database is not available
function getDefaultPrompt(type: string, scenarioId: string): string {
  const defaults: Record<string, string> = {
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

  return defaults[scenarioId] || `Write a professional real estate ${type}.`
}
