import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { chatId, helpful, feedbackText } = await req.json()

    if (!chatId || helpful === undefined) {
      return NextResponse.json({ error: 'chatId and helpful required' }, { status: 400 })
    }

    // Try to save feedback
    try {
      const { error } = await supabase
        .from('assistant_feedback')
        .insert({
          chat_id: chatId,
          helpful,
          feedback_text: feedbackText || null,
        })

      if (error) {
        console.error('Feedback save error:', error)
        // Don't fail the request if the table doesn't exist
      }
    } catch (e) {
      console.log('Could not save feedback:', e)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
