import { createClient } from '@supabase/supabase-js'
import NorCRMApp from './NorCRMApp'

// Force dynamic rendering — never cache this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getCRMStats() {
  const [
    { count: total },
    { count: newCount },
    { count: contacted },
    { count: interested },
    { count: appointment },
    { count: closed },
    { count: dead }
  ] = await Promise.all([
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'interested'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'appointment'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'dead'),
  ])

  return {
    total: total || 0,
    new: newCount || 0,
    contacted: contacted || 0,
    interested: interested || 0,
    appointment: appointment || 0,
    closed: closed || 0,
    dead: dead || 0,
  }
}

async function getCRMLeads() {
  // First get CRM leads
  const { data: crmLeads, error: crmError } = await supabase
    .from('crm_leads')
    .select('*')
    .order('next_action_date', { ascending: true, nullsFirst: false })

  if (crmError || !crmLeads) {
    console.error('Error fetching CRM leads:', crmError)
    return []
  }

  // Get property IDs
  const propertyIds = crmLeads.map(l => l.property_id)
  
  if (propertyIds.length === 0) return []

  // Get properties with contacts
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select(`
      *,
      contacts (
        id,
        name,
        role,
        is_decision_maker,
        phones (id, number, type, is_dnc, is_verified),
        emails (id, email, is_verified)
      )
    `)
    .in('id', propertyIds)

  if (propError) {
    console.error('Error fetching properties:', propError)
    return []
  }

  // Combine CRM leads with property data
  const combined = crmLeads.map(crmLead => {
    const property = properties?.find(p => p.id === crmLead.property_id)
    
    // Count callable phones and emails
    let callablePhones = 0
    let totalEmails = 0
    property?.contacts?.forEach((contact: any) => {
      callablePhones += contact.phones?.filter((p: any) => !p.is_dnc).length || 0
      totalEmails += contact.emails?.length || 0
    })

    return {
      ...crmLead,
      property,
      callablePhones,
      totalEmails,
    }
  })

  return combined
}

export default async function NorCRMPage() {
  const [stats, leads] = await Promise.all([
    getCRMStats(),
    getCRMLeads()
  ])

  return (
    <NorCRMApp 
      initialStats={stats}
      initialLeads={leads as any}
    />
  )
}
