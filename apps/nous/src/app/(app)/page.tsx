import { createClient } from '@supabase/supabase-js'
import Dashboard from './Dashboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getDashboardData() {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Parallel fetch all stats
  const [
    // NorLead Pipeline
    { count: totalProperties },
    { count: callablePhones },
    { count: totalEmails },
    { count: totalContacts },
    
    // CRM Stats
    { count: inCrm },
    { count: crmNew },
    { count: crmContacted },
    { count: crmInterested },
    { count: crmAppointment },
    { count: crmClosed },
    
    // Today's follow-ups
    { data: followUpsToday, count: followUpCount },
    
    // Hot leads
    { data: hotLeads, count: hotCount },
    
    // Recent activities
    { data: recentActivities },
    
    // Weekly performance
    { count: callsMade },
    { count: contactsReached },
    { count: appointmentsSet },
    
  ] = await Promise.all([
    // NorLead Pipeline
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('phones').select('*', { count: 'exact', head: true }).eq('is_dnc', false),
    supabase.from('emails').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    
    // CRM Stats
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'interested'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'appointment'),
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    
    // Today's follow-ups - need to get crm_leads with property data
    supabase
      .from('crm_leads')
      .select('*, properties(street_address, city)', { count: 'exact' })
      .lte('next_action_date', today + 'T23:59:59')
      .gte('next_action_date', today + 'T00:00:00')
      .order('next_action_date', { ascending: true })
      .limit(5),
    
    // Hot leads
    supabase
      .from('crm_leads')
      .select('*, properties(street_address, city)', { count: 'exact' })
      .eq('priority', 'hot')
      .limit(5),
    
    // Recent activities with lead info
    supabase
      .from('crm_activities')
      .select('*, crm_leads(property_id, properties(street_address, city))')
      .order('created_at', { ascending: false })
      .limit(10),
    
    // Weekly performance
    supabase
      .from('crm_activities')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'call')
      .gte('created_at', weekAgo),
    supabase
      .from('crm_activities')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'call')
      .like('outcome', 'answered%')
      .gte('created_at', weekAgo),
    supabase
      .from('crm_activities')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'call')
      .like('outcome', '%appointment_set%')
      .gte('created_at', weekAgo),
  ])

  return {
    norLead: {
      totalProperties: totalProperties || 0,
      callablePhones: callablePhones || 0,
      totalEmails: totalEmails || 0,
      totalContacts: totalContacts || 0,
    },
    crm: {
      total: inCrm || 0,
      new: crmNew || 0,
      contacted: crmContacted || 0,
      interested: crmInterested || 0,
      appointment: crmAppointment || 0,
      closed: crmClosed || 0,
    },
    followUps: {
      count: followUpCount || 0,
      items: followUpsToday || [],
    },
    hotLeads: {
      count: hotCount || 0,
      items: hotLeads || [],
    },
    activities: recentActivities || [],
    performance: {
      callsMade: callsMade || 0,
      contactsReached: contactsReached || 0,
      appointmentsSet: appointmentsSet || 0,
    },
  }
}

export default async function HomePage() {
  const data = await getDashboardData()
  
  return <Dashboard initialData={data} />
}
