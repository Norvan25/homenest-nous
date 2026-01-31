import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/debug-logger'

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        reply: "I'm currently unavailable. Please check the ANTHROPIC_API_KEY configuration.",
      })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const systemPrompt = `You are NorGuide, the helpful assistant for HomeNest Nous - a real estate lead management platform.

Your job is to help users navigate the platform and use its features effectively.

KEY FEATURES:
- Dashboard: Overview of leads, pipeline, and activities
- Call Workspace: AI-powered calling with queue management
- NorLead: Lead discovery and filtering
- NorCRM: Pipeline management and lead tracking
- NorW (Training Hub):
  - NorTrain: Practice Room (practice with AI personas), Agent Lab (watch AI conversations)
  - NorCoach: Call Analyzer (analyze recordings), Prompt Evolution (track AI prompts)
  - NorGuide: Script Library, Scenario Bank
- NorDOSC (Documents): Email Writer, Letter Writer, SMS Writer, Template Library

GUIDELINES:
- Be concise and helpful
- Provide step-by-step instructions when needed
- If you don't know something, say so
- Suggest relevant features when appropriate
- Keep responses under 150 words unless more detail is needed`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...history.slice(-6).map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: message },
      ],
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    logger.info('NorGuide chat response', { message_length: message.length, reply_length: reply.length }, 'norguide')

    return NextResponse.json({ reply })
  } catch (error) {
    logger.error('NorGuide chat failed', error as Error, {}, 'norguide')
    return NextResponse.json({
      reply: "Sorry, I couldn't process that request. Please try again.",
    })
  }
}
