import { supabase } from '@/lib/supabase'
import type { ContentGeneration } from '@/types/nordosc'

// Calculate Levenshtein distance for edit tracking
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        )
      }
    }
  }
  return dp[m][n]
}

// Generate unique thread ID
function generateThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const nordoscLogger = {
  // Log content generation
  async logGeneration(data: {
    userId: string
    agentId?: string
    agentVersion?: number
    contentType: 'email' | 'letter' | 'sms' | 'script' | 'other'
    scenarioKey: string
    scenarioName: string
    systemPromptUsed?: string
    userInput?: string
    variables: Record<string, any>
    generatedContent: string
    generatedSubject?: string
    modelUsed?: string
    tokensInput?: number
    tokensOutput?: number
    generationTimeMs: number
    temperature?: number
  }): Promise<string | null> {
    try {
      const { data: result, error } = await supabase
        .from('content_generations')
        .insert({
          user_id: data.userId,
          agent_id: data.agentId || null,
          agent_version: data.agentVersion || null,
          content_type: data.contentType,
          scenario_key: data.scenarioKey,
          scenario_name: data.scenarioName,
          system_prompt_used: data.systemPromptUsed || null,
          user_input: data.userInput || null,
          variables: data.variables,
          generated_content: data.generatedContent,
          generated_subject: data.generatedSubject || null,
          model_used: data.modelUsed || 'claude-sonnet-4-20250514',
          tokens_input: data.tokensInput || null,
          tokens_output: data.tokensOutput || null,
          generation_time_ms: data.generationTimeMs,
          temperature: data.temperature || 0.7,
        })
        .select('id')
        .single()

      if (error) throw error
      return result?.id || null
    } catch (err) {
      console.error('Failed to log generation:', err)
      return null
    }
  },

  // Log user feedback (thumbs up/down)
  async logFeedback(generationId: string, thumbs: 'up' | 'down'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_generations')
        .update({
          user_thumbs: thumbs,
          user_rating: thumbs === 'up' ? 5 : 1,
        })
        .eq('id', generationId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Failed to log feedback:', err)
      return false
    }
  },

  // Log user edit
  async logEdit(generationId: string, originalContent: string, editedContent: string): Promise<boolean> {
    try {
      const editDistance = levenshteinDistance(originalContent, editedContent)
      
      const { error } = await supabase
        .from('content_generations')
        .update({
          user_edited: true,
          edited_content: editedContent,
          edit_distance: editDistance,
        })
        .eq('id', generationId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Failed to log edit:', err)
      return false
    }
  },

  // Log outreach send
  async logSend(data: {
    generationId: string
    userId: string
    contactId?: string
    propertyId?: string
    recipientEmail?: string
    recipientPhone?: string
    recipientName?: string
    channel: 'email' | 'sms' | 'whatsapp' | 'letter'
    subject?: string
    body: string
  }): Promise<{ sendId: string; threadId: string } | null> {
    try {
      const threadId = generateThreadId()
      
      const { data: result, error } = await supabase
        .from('outreach_sends')
        .insert({
          generation_id: data.generationId,
          user_id: data.userId,
          contact_id: data.contactId || null,
          property_id: data.propertyId || null,
          recipient_email: data.recipientEmail || null,
          recipient_phone: data.recipientPhone || null,
          recipient_name: data.recipientName || null,
          channel: data.channel,
          thread_id: threadId,
          subject: data.subject || null,
          body: data.body,
          status: 'pending',
        })
        .select('id')
        .single()

      if (error) throw error
      
      // Also create conversation thread
      await supabase.from('conversation_threads').insert({
        thread_id: threadId,
        user_id: data.userId,
        contact_id: data.contactId || null,
        property_id: data.propertyId || null,
        channel: data.channel,
        subject: data.subject || null,
        status: 'active',
        first_message_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })

      return { sendId: result?.id, threadId }
    } catch (err) {
      console.error('Failed to log send:', err)
      return null
    }
  },

  // Flag content for review
  async flagForReview(generationId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_generations')
        .update({
          flagged_for_review: true,
          flag_reason: reason,
        })
        .eq('id', generationId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Failed to flag content:', err)
      return false
    }
  },

  // Get scenario performance (for analytics)
  async getScenarioPerformance(days: number = 30): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('scenario_performance')
        .select('*')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Failed to get performance:', err)
      return []
    }
  },

  // Get recent generations for a user
  async getRecentGenerations(userId: string, limit: number = 20): Promise<ContentGeneration[]> {
    try {
      const { data, error } = await supabase
        .from('content_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Failed to get generations:', err)
      return []
    }
  },

  // Get conversation thread
  async getThread(threadId: string): Promise<any> {
    try {
      
      const { data: thread } = await supabase
        .from('conversation_threads')
        .select('*')
        .eq('thread_id', threadId)
        .single()

      const { data: sends } = await supabase
        .from('outreach_sends')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      const { data: responses } = await supabase
        .from('outreach_responses')
        .select('*')
        .eq('thread_id', threadId)
        .order('received_at', { ascending: true })

      return {
        ...thread,
        messages: [
          ...(sends || []).map(s => ({ ...s, type: 'outbound' })),
          ...(responses || []).map(r => ({ ...r, type: 'inbound' })),
        ].sort((a, b) => 
          new Date(a.created_at || a.received_at).getTime() - 
          new Date(b.created_at || b.received_at).getTime()
        ),
      }
    } catch (err) {
      console.error('Failed to get thread:', err)
      return null
    }
  },
}
