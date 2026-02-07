/**
 * Email Queue Actions
 * 
 * Functions for managing the 4-queue email system:
 * - Fetch queue items & settings
 * - Add leads to queue
 * - Send via n8n webhook
 * - Update queue state
 */

import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// ─── Types ──────────────────────────────────────────────────────

export interface EmailQueueSettings {
  id: string
  queue_number: number
  queue_label: string | null
  scenario_key: string | null
  from_name: string
  from_email: string
  send_interval_seconds: number
  is_sending: boolean
  is_paused: boolean
  last_batch_id: string | null
}

export interface EmailQueueItem {
  id: string
  queue_number: number
  batch_id: string | null
  property_id: string | null
  contact_id: string | null
  email_id: string | null
  contact_name: string | null
  contact_first_name: string | null
  contact_email: string
  property_address: string | null
  property_city: string | null
  property_state: string | null
  property_zip: string | null
  property_price: number | null
  property_dom: number | null
  property_beds: number | null
  property_baths: number | null
  property_sqft: number | null
  property_type: string | null
  property_remarks: string | null
  estimated_equity: string | null
  estimated_home_value: string | null
  is_absentee_owner: boolean
  owner_estimated_age: string | null
  length_of_residence: string | null
  marital_status: string | null
  has_children: string | null
  position: number
  status: string
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export interface EmailQueueData {
  queueNumber: number
  items: EmailQueueItem[]
  settings: EmailQueueSettings
  stats: {
    total: number
    queued: number
    sent: number
    failed: number
    sending: number
  }
}

export interface EmailScenario {
  key: string
  label: string
}

// Hardcoded scenarios (fallback if document_scenarios table doesn't exist)
export const defaultScenarios: EmailScenario[] = [
  { key: 'expired_sympathy', label: 'Expired Listing — Empathy Approach' },
  { key: 'market_update', label: 'Market Update — Data Driven' },
  { key: 'reengagement', label: 'Re-engagement — Check In' },
  { key: 'investor_opportunity', label: 'Investor — ROI Focus' },
]

// ─── Fetch Functions ──────────────────────────────────────────────

export async function fetchEmailQueues(): Promise<EmailQueueData[]> {
  const queues: EmailQueueData[] = []

  for (let q = 1; q <= 4; q++) {
    const data = await fetchEmailQueue(q)
    queues.push(data)
  }

  return queues
}

export async function fetchEmailQueue(queueNumber: number): Promise<EmailQueueData> {
  // Fetch settings
  const { data: settingsData } = await supabase
    .from('email_queue_settings')
    .select('*')
    .eq('queue_number', queueNumber)
    .single()

  const settings: EmailQueueSettings = settingsData || {
    id: '',
    queue_number: queueNumber,
    queue_label: `E${queueNumber}`,
    scenario_key: null,
    from_name: 'Suzanna Saharyan',
    from_email: 'suzanna@homenest.house',
    send_interval_seconds: 3,
    is_sending: false,
    is_paused: false,
    last_batch_id: null,
  }

  // Fetch queue items
  const { data: items } = await supabase
    .from('email_queue')
    .select('*')
    .eq('queue_number', queueNumber)
    .order('position', { ascending: true })

  const queueItems: EmailQueueItem[] = items || []

  // Compute stats
  const stats = {
    total: queueItems.length,
    queued: queueItems.filter(i => i.status === 'queued').length,
    sent: queueItems.filter(i => i.status === 'sent').length,
    failed: queueItems.filter(i => i.status === 'failed').length,
    sending: queueItems.filter(i => i.status === 'sending').length,
  }

  return { queueNumber, items: queueItems, settings, stats }
}

// ─── Queue Management ──────────────────────────────────────────────

export async function addLeadsToEmailQueue(
  leadIds: string[],
  queueNumber: number
): Promise<{ success: boolean; added: number; message: string }> {
  try {
    console.log('[EmailQueue] Starting addLeadsToEmailQueue:', { leadIds, queueNumber })

    // Step 0: Verify email_queue table exists by doing a simple count
    const { error: tableCheck } = await supabase
      .from('email_queue')
      .select('id', { count: 'exact', head: true })

    if (tableCheck) {
      console.error('[EmailQueue] Table check failed:', tableCheck)
      return { 
        success: false, 
        added: 0, 
        message: `email_queue table not found. Please run the database migration (csv_upload_email_queue.sql) in Supabase SQL Editor first.` 
      }
    }

    // Get current max position in queue
    const { data: existing } = await supabase
      .from('email_queue')
      .select('position')
      .eq('queue_number', queueNumber)
      .order('position', { ascending: false })
      .limit(1)

    let nextPosition = (existing?.[0]?.position || 0) + 1

    // Step 1: Fetch the CRM leads to get property_ids
    const { data: crmLeads, error: crmError } = await supabase
      .from('crm_leads')
      .select('id, property_id')
      .in('id', leadIds)

    if (crmError) {
      console.error('[EmailQueue] CRM leads query error:', crmError)
      return { success: false, added: 0, message: crmError.message }
    }

    if (!crmLeads || crmLeads.length === 0) {
      console.log('[EmailQueue] No CRM leads found for IDs:', leadIds)
      return { success: false, added: 0, message: 'No matching CRM leads found' }
    }

    console.log('[EmailQueue] Found CRM leads:', crmLeads.length)
    const propertyIds = crmLeads.map(l => l.property_id).filter(Boolean)

    if (propertyIds.length === 0) {
      return { success: false, added: 0, message: 'CRM leads have no linked properties' }
    }

    // Step 2: Fetch properties — use only base schema columns
    // (first_name, is_absentee_owner, insights, property_type, remarks are migration-dependent)
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select(`
        id,
        street_address,
        city,
        state,
        zip,
        price,
        dom,
        beds,
        baths,
        sqft,
        contacts (
          id,
          name,
          is_decision_maker,
          emails (
            id,
            email
          )
        )
      `)
      .in('id', propertyIds)

    if (propError) {
      console.error('[EmailQueue] Properties query error:', propError)
      return { success: false, added: 0, message: propError.message }
    }

    if (!properties || properties.length === 0) {
      console.log('[EmailQueue] No properties found for IDs:', propertyIds)
      return { success: false, added: 0, message: 'No properties found for selected leads' }
    }

    console.log('[EmailQueue] Found properties:', properties.length)

    // Step 3: Optionally fetch extended property columns (migration-dependent)
    let extendedProps: Record<string, any> = {}
    try {
      const { data: extData } = await supabase
        .from('properties')
        .select('id, property_type, remarks, insights')
        .in('id', propertyIds)
      if (extData) {
        for (const p of extData) {
          extendedProps[p.id] = p
        }
      }
    } catch {
      // Migration columns not available yet — that's fine
      console.log('[EmailQueue] Extended property columns not available (migration may not be run yet)')
    }

    // Step 4: Optionally fetch extended contact columns
    const allContactIds: string[] = []
    for (const prop of properties) {
      const contacts = (prop as any).contacts || []
      for (const c of contacts) {
        allContactIds.push(c.id)
      }
    }
    let extendedContacts: Record<string, any> = {}
    if (allContactIds.length > 0) {
      try {
        const { data: extContactData } = await supabase
          .from('contacts')
          .select('id, first_name, is_absentee_owner')
          .in('id', allContactIds)
        if (extContactData) {
          for (const c of extContactData) {
            extendedContacts[c.id] = c
          }
        }
      } catch {
        console.log('[EmailQueue] Extended contact columns not available (migration may not be run yet)')
      }
    }

    const queueItems: any[] = []

    for (const property of properties) {
      const contacts = (property as any).contacts || []
      // Find primary contact with email
      const primaryContact = contacts.find((c: any) => 
        c.is_decision_maker && c.emails?.length > 0
      ) || contacts.find((c: any) => c.emails?.length > 0)

      if (!primaryContact || !primaryContact.emails?.[0]) {
        console.log('[EmailQueue] Skipping property', property.id, '- no contact with email. Contacts:', contacts.length)
        continue
      }

      const email = primaryContact.emails[0]
      const ext = extendedProps[property.id] || {}
      const extContact = extendedContacts[primaryContact.id] || {}
      const insights = ext.insights || {}

      queueItems.push({
        queue_number: queueNumber,
        property_id: property.id,
        contact_id: primaryContact.id,
        email_id: email.id,
        contact_name: primaryContact.name || 'Unknown',
        contact_first_name: extContact.first_name || primaryContact.name?.split(' ')[0] || '',
        contact_email: email.email,
        property_address: property.street_address,
        property_city: property.city,
        property_state: property.state || 'CA',
        property_zip: property.zip,
        property_price: property.price,
        property_dom: property.dom,
        property_beds: property.beds,
        property_baths: property.baths,
        property_sqft: property.sqft,
        property_type: ext.property_type || null,
        property_remarks: ext.remarks || null,
        estimated_equity: insights['Estimated Equity'] || null,
        estimated_home_value: insights['Estimated Market Home Value'] || null,
        is_absentee_owner: extContact.is_absentee_owner || false,
        owner_estimated_age: insights['Estimated Age'] || null,
        length_of_residence: insights['Length of Residence'] || null,
        marital_status: insights['Marital Status'] || null,
        has_children: insights['Presence of Children'] || null,
        position: nextPosition++,
        status: 'queued',
      })
    }

    if (queueItems.length === 0) {
      const contactCounts = properties.map((p: any) => ({
        id: p.id,
        contacts: (p.contacts || []).length,
        withEmails: (p.contacts || []).filter((c: any) => c.emails?.length > 0).length
      }))
      console.log('[EmailQueue] No queue items built. Contact details:', contactCounts)
      return { 
        success: false, 
        added: 0, 
        message: `No leads with email addresses found (${properties.length} properties checked, but none had contacts with emails).` 
      }
    }

    console.log('[EmailQueue] Inserting', queueItems.length, 'items into email_queue')

    const { error: insertError } = await supabase
      .from('email_queue')
      .insert(queueItems)

    if (insertError) {
      console.error('[EmailQueue] Insert error:', insertError)
      return { success: false, added: 0, message: `Insert failed: ${insertError.message}` }
    }

    console.log('[EmailQueue] Success! Added', queueItems.length, 'items')

    return {
      success: true,
      added: queueItems.length,
      message: `${queueItems.length} leads added to E${queueNumber}`,
    }
  } catch (err: any) {
    console.error('[EmailQueue] Unexpected error:', err)
    return { success: false, added: 0, message: err.message || 'Unexpected error adding to queue' }
  }
}

export async function clearEmailQueue(queueNumber: number): Promise<boolean> {
  const { error } = await supabase
    .from('email_queue')
    .delete()
    .eq('queue_number', queueNumber)

  // Also reset settings
  await supabase
    .from('email_queue_settings')
    .update({
      is_sending: false,
      is_paused: false,
      last_batch_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('queue_number', queueNumber)

  return !error
}

export async function removeFromEmailQueue(itemIds: string[]): Promise<boolean> {
  const { error } = await supabase
    .from('email_queue')
    .delete()
    .in('id', itemIds)
  return !error
}

export async function updateEmailQueueSettings(
  queueNumber: number,
  updates: Partial<EmailQueueSettings>
): Promise<boolean> {
  const { error } = await supabase
    .from('email_queue_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('queue_number', queueNumber)

  return !error
}

// ─── Send Functions ──────────────────────────────────────────────

export async function startEmailSend(queueNumber: number): Promise<{
  success: boolean
  batchId?: string
  message: string
}> {
  const queueData = await fetchEmailQueue(queueNumber)

  if (!queueData.settings.scenario_key) {
    return { success: false, message: 'Please select a scenario first' }
  }

  const queuedItems = queueData.items.filter(i => i.status === 'queued')
  if (queuedItems.length === 0) {
    return { success: false, message: 'No items to send' }
  }

  const batchId = uuidv4()

  // Update settings
  await supabase
    .from('email_queue_settings')
    .update({
      is_sending: true,
      is_paused: false,
      last_batch_id: batchId,
      updated_at: new Date().toISOString(),
    })
    .eq('queue_number', queueNumber)

  // Mark all queued items with batch_id
  await supabase
    .from('email_queue')
    .update({ batch_id: batchId })
    .eq('queue_number', queueNumber)
    .eq('status', 'queued')

  // Build webhook payload
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BULK_EMAIL
    || 'https://norvan-ai.app.n8n.cloud/webhook/bulk-email-send'

  const payload = {
    batch_id: batchId,
    queue_number: queueNumber,
    scenario_key: queueData.settings.scenario_key,
    from_name: queueData.settings.from_name,
    from_email: queueData.settings.from_email,
    send_interval_seconds: queueData.settings.send_interval_seconds,
    leads: queuedItems.map(item => ({
      queue_item_id: item.id,
      contact_name: item.contact_name,
      contact_first_name: item.contact_first_name,
      contact_email: item.contact_email,
      property_address: item.property_address,
      property_city: item.property_city,
      property_state: item.property_state,
      property_zip: item.property_zip,
      property_price: item.property_price,
      property_dom: item.property_dom,
      property_beds: item.property_beds,
      property_baths: item.property_baths,
      property_sqft: item.property_sqft,
      property_type: item.property_type,
      property_remarks: item.property_remarks,
      estimated_equity: item.estimated_equity,
      estimated_home_value: item.estimated_home_value,
      is_absentee_owner: item.is_absentee_owner,
      owner_estimated_age: item.owner_estimated_age,
      length_of_residence: item.length_of_residence,
      marital_status: item.marital_status,
      has_children: item.has_children,
    })),
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`)
    }

    return { success: true, batchId, message: `Sending ${queuedItems.length} emails...` }
  } catch (err: any) {
    // Reset sending state on webhook failure
    await supabase
      .from('email_queue_settings')
      .update({ is_sending: false, updated_at: new Date().toISOString() })
      .eq('queue_number', queueNumber)

    return { success: false, message: `Webhook error: ${err.message}` }
  }
}

export async function pauseEmailSend(queueNumber: number): Promise<boolean> {
  const { error } = await supabase
    .from('email_queue_settings')
    .update({
      is_paused: true,
      updated_at: new Date().toISOString(),
    })
    .eq('queue_number', queueNumber)

  return !error
}

export async function resumeEmailSend(queueNumber: number): Promise<boolean> {
  const { error } = await supabase
    .from('email_queue_settings')
    .update({
      is_paused: false,
      updated_at: new Date().toISOString(),
    })
    .eq('queue_number', queueNumber)

  return !error
}

// ─── Scenario Fetching ──────────────────────────────────────────────

export async function fetchScenarios(): Promise<EmailScenario[]> {
  try {
    const { data, error } = await supabase
      .from('document_scenarios')
      .select('scenario_key, name')
      .eq('is_active', true)
      .eq('content_type', 'email')

    if (error || !data || data.length === 0) {
      return defaultScenarios
    }

    return data.map(s => ({ key: s.scenario_key, label: s.name }))
  } catch {
    return defaultScenarios
  }
}
