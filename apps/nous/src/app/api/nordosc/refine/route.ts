import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/debug-logger'

export async function POST(request: NextRequest) {
  try {
    const { content, instruction } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        content: content, // Return original if no API key
      })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const systemPrompt = `You are an expert editor helping refine real estate communications.

Take the provided content and apply the requested modification while maintaining:
- Professional tone
- The core message and intent
- Any placeholders like [Name] or [Address]

Only output the refined content, no explanations.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please refine this content with the following instruction: "${instruction}"

ORIGINAL CONTENT:
${content}`,
        },
      ],
    })

    const refinedContent = response.content[0].type === 'text' ? response.content[0].text : content

    logger.info('Document refined', { instruction, original_length: content.length, refined_length: refinedContent.length }, 'nordosc')

    return NextResponse.json({ content: refinedContent })
  } catch (error) {
    logger.error('Document refinement failed', error as Error, {}, 'nordosc')
    return NextResponse.json({ 
      error: 'Failed to refine content',
    }, { status: 500 })
  }
}
