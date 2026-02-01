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
    const { sendId, threadId, to, subject, body: emailBody, recipientName } = body

    // Check for n8n webhook URL
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

    if (n8nWebhookUrl) {
      // Trigger n8n workflow to send the email
      const response = await fetch(`${n8nWebhookUrl}/outreach/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendId,
          threadId,
          to,
          subject,
          body: emailBody,
          recipientName,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger email send')
      }

      // Update send status
      await supabase
        .from('outreach_sends')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', sendId)

      return NextResponse.json({ success: true, status: 'sent' })
    } else {
      // Development mode: just mark as sent
      console.log('DEV MODE: Would send email to:', to)
      console.log('Subject:', subject)
      console.log('Body:', emailBody)

      // Update send status to 'sent' for development
      await supabase
        .from('outreach_sends')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', sendId)

      return NextResponse.json({ 
        success: true, 
        status: 'sent',
        message: 'Development mode - email logged but not actually sent. Set N8N_WEBHOOK_URL to enable real sending.'
      })
    }
  } catch (error: any) {
    console.error('Send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
