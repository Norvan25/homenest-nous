import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Create supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, scenario, variables } = body

    // Get scenario prompt from database (or use defaults)
    const { data: scenarioData } = await supabase
      .from('document_scenarios')
      .select('*, tool_configurations(*)')
      .eq('scenario_key', scenario)
      .single()

    // Build the prompt
    const systemPrompt = buildSystemPrompt(type, scenarioData)
    const userPrompt = buildUserPrompt(variables, scenarioData?.prompt_template)

    // Check if we have Anthropic API key
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    
    if (anthropicKey) {
      // Use Anthropic Claude
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic = new Anthropic({ apiKey: anthropicKey })

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      })

      // Parse response
      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const { subject, body: emailBody } = parseEmailResponse(content.text)

      return NextResponse.json({
        subject,
        body: emailBody,
        agentId: scenarioData?.tool_configurations?.id,
        model: 'claude-sonnet-4-20250514',
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        promptUsed: systemPrompt,
      })
    } else {
      // Fallback: Generate mock response for development
      const mockSubject = `Quick question about ${variables.property_address || 'your property'}`
      const mockBody = generateMockEmail(type, variables, scenario)

      return NextResponse.json({
        subject: mockSubject,
        body: mockBody,
        agentId: null,
        model: 'mock-development',
        tokensInput: 0,
        tokensOutput: 0,
        promptUsed: systemPrompt,
      })
    }
  } catch (error: any) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function buildSystemPrompt(type: string, scenario: any): string {
  return `You are an expert real estate copywriter. Write compelling ${type}s that get responses.

Your style:
- Professional but warm
- Concise - respect the reader's time
- Focus on THEIR needs, not the agent's
- Include a clear call to action
- Never be pushy or salesy

Format your response as:
SUBJECT: [subject line]
---
[email body]`
}

function buildUserPrompt(variables: Record<string, any>, template?: string): string {
  if (template) {
    let prompt = template
    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''))
    })
    return prompt
  }

  // Default prompt
  return `Write an email to a property owner with these details:
- Owner Name: ${variables.owner_name || 'Homeowner'}
- Property Address: ${variables.property_address || 'the property'}
- City: ${variables.city || ''}
- Price: ${variables.price ? `$${variables.price.toLocaleString()}` : 'N/A'}
- Days on Market: ${variables.dom || 'N/A'}
- Beds/Baths: ${variables.beds || '?'}/${variables.baths || '?'}
- Agent Name: ${variables.agent_name || 'Agent'}
- Agent Phone: ${variables.agent_phone || ''}

Goal: Start a conversation about potentially representing them or buying their property.`
}

function parseEmailResponse(text: string): { subject: string; body: string } {
  const parts = text.split('---')
  
  let subject = ''
  let body = text

  if (parts.length >= 2) {
    const subjectMatch = parts[0].match(/SUBJECT:\s*(.+)/i)
    if (subjectMatch) {
      subject = subjectMatch[1].trim()
    }
    body = parts.slice(1).join('---').trim()
  }

  return { subject, body }
}

function generateMockEmail(type: string, variables: Record<string, any>, scenario: string): string {
  const ownerName = variables.owner_name || 'Homeowner'
  const address = variables.property_address || 'your property'
  const agentName = variables.agent_name || 'Agent'
  const agentPhone = variables.agent_phone || ''

  return `Hi ${ownerName},

I noticed your property at ${address} and wanted to reach out personally.

I specialize in helping homeowners in your area, and I'd love to have a quick conversation about your real estate goals - whether that's selling, staying, or just understanding your options.

Would you have 10 minutes for a brief call this week? No pressure, just a friendly chat.

Best regards,
${agentName}
${agentPhone}

P.S. This is a mock email generated for development. Connect your Anthropic API key for real AI-generated content.`
}
