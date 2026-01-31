import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Fetch queue
export async function GET() {
  const { data, error } = await supabase
    .from('call_queue')
    .select('*')
    .eq('status', 'queued')
    .order('position', { ascending: true })

  if (error) {
    console.error('GET call_queue error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ queue: data })
}

// POST - Add leads to queue
export async function POST(req: NextRequest) {
  try {
    const { leadIds, queueNumber = 1 } = await req.json()

    console.log('=== ADD TO CALL QUEUE ===')
    console.log('Lead IDs received:', leadIds)
    console.log('Queue number:', queueNumber)

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array required' }, { status: 400 })
    }

    // Get current max position for this queue
    const { data: maxPos } = await supabase
      .from('call_queue')
      .select('position')
      .eq('queue_number', queueNumber)
      .eq('status', 'queued')
      .order('position', { ascending: false })
      .limit(1)
      .single()

    let position = (maxPos?.position || 0) + 1
    console.log('Starting position:', position)

    // Get lead details with property info (including price and DOM for dynamic variables)
    const { data: leads, error: leadsError } = await supabase
      .from('crm_leads')
      .select(`
        id,
        property_id,
        properties (
          id,
          street_address,
          city,
          price,
          dom
        )
      `)
      .in('id', leadIds)

    console.log('Leads query result:', { leads, leadsError })

    if (leadsError) {
      return NextResponse.json({ error: 'Failed to fetch leads: ' + leadsError.message }, { status: 500 })
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: 'No leads found for the provided IDs' }, { status: 400 })
    }

    // For each lead, get callable phones and add to queue
    const queueItems: any[] = []

    for (const lead of leads) {
      console.log('Processing lead:', lead.id, 'property_id:', lead.property_id)
      
      const propertiesData = lead.properties as Array<{ 
        id: string; 
        street_address: string; 
        city: string;
        price: number | null;
        dom: number | null;
      }> | { 
        id: string; 
        street_address: string; 
        city: string;
        price: number | null;
        dom: number | null;
      } | null
      
      // Handle both array (from join) and single object cases
      const property = Array.isArray(propertiesData) ? propertiesData[0] : propertiesData
      console.log('Property data:', property)
      
      if (!property) {
        console.log('No property found for lead, skipping')
        continue
      }

      // Get contacts for this property
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          id,
          name,
          phones (
            id,
            number,
            type,
            is_dnc
          )
        `)
        .eq('property_id', lead.property_id)

      console.log('Contacts query for property_id', lead.property_id, ':', { contacts, contactsError })

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError)
        continue
      }

      if (!contacts || contacts.length === 0) {
        console.log('No contacts found for property')
        continue
      }

      // Add each callable phone to queue
      for (const contact of contacts) {
        console.log('Processing contact:', contact.id, contact.name)
        
        const phones = contact.phones as Array<{ id: string; number: string; type: string; is_dnc: boolean }> | null
        console.log('Contact phones:', phones)
        
        if (!phones || phones.length === 0) {
          console.log('No phones for contact')
          continue
        }
        
        for (const phone of phones) {
          console.log('Phone:', phone.number, 'DNC:', phone.is_dnc)
          
          if (phone.is_dnc) {
            console.log('Skipping DNC number')
            continue
          }

          queueItems.push({
            crm_lead_id: lead.id,
            contact_id: contact.id,
            phone_id: phone.id,
            phone_number: phone.number,
            contact_name: contact.name,
            property_address: `${property.street_address}, ${property.city}`,
            property_city: property.city,
            list_price: property.price,
            days_on_market: property.dom,
            position: position++,
            status: 'queued',
            queue_number: queueNumber,
          })
        }
      }
    }

    console.log('Queue items to insert:', queueItems.length)
    console.log('Queue items:', JSON.stringify(queueItems, null, 2))

    if (queueItems.length === 0) {
      return NextResponse.json({ 
        error: 'No callable phones found for selected leads. Make sure contacts have phone numbers that are not marked DNC.',
        debug: {
          leadsFound: leads.length,
          leadIds
        }
      }, { status: 400 })
    }

    // Insert all queue items
    const { data: inserted, error: insertError } = await supabase
      .from('call_queue')
      .insert(queueItems)
      .select()

    console.log('Insert result:', { inserted, insertError })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ 
        error: insertError.message,
        hint: insertError.hint || 'Make sure the call_queue table exists in Supabase'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      added: inserted?.length || 0,
      message: `Added ${inserted?.length || 0} phone numbers to call queue`
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error.message || 'Unexpected error occurred'
    }, { status: 500 })
  }
}

// DELETE - Clear all queued items
export async function DELETE() {
  const { error } = await supabase
    .from('call_queue')
    .delete()
    .eq('status', 'queued')

  if (error) {
    console.error('DELETE call_queue error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
