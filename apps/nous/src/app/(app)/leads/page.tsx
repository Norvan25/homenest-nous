import { createClient } from '@supabase/supabase-js'
import { LeadsDashboard } from './LeadsDashboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getStats() {
  const [
    { count: totalLeads },
    { count: callablePhones },
    { count: totalEmails },
    { count: newLeads }
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('phones').select('*', { count: 'exact', head: true }).eq('is_dnc', false),
    supabase.from('emails').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  ])

  return {
    totalLeads: totalLeads || 0,
    callablePhones: callablePhones || 0,
    totalEmails: totalEmails || 0,
    newLeads: newLeads || 0
  }
}

async function getCities() {
  const { data } = await supabase
    .from('properties')
    .select('city')
    .order('city')

  if (!data) return []
  
  // Get unique cities with counts
  const cityCount: Record<string, number> = {}
  data.forEach((d: { city: string }) => {
    cityCount[d.city] = (cityCount[d.city] || 0) + 1
  })
  
  return Object.entries(cityCount)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
}

async function getLeads() {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      contacts (
        id,
        name,
        role,
        is_decision_maker,
        priority,
        phones (
          id,
          number,
          number_normalized,
          type,
          is_dnc,
          is_verified,
          attempt_count,
          last_result
        ),
        emails (
          id,
          email,
          is_verified
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  return data || []
}

export default async function LeadsPage() {
  const [stats, cities, leads] = await Promise.all([
    getStats(),
    getCities(),
    getLeads()
  ])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Leads Dashboard</h1>
        </div>
        <p className="text-white/50">
          Manage and contact your {stats.totalLeads} real estate leads
        </p>
      </div>

      <LeadsDashboard 
        initialStats={stats} 
        initialLeads={leads as any} 
        cities={cities} 
      />
    </div>
  )
}
