import { createClient } from '@supabase/supabase-js'
import NorLeadApp from './NorLeadApp'

// Force dynamic rendering — never cache this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getSellerLeads() {
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

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  return data || []
}

async function getFilterOptions() {
  // Get unique cities with counts
  const { data: cityData } = await supabase
    .from('properties')
    .select('city')
  
  const cityCounts: Record<string, number> = {}
  cityData?.forEach((d: { city: string }) => {
    cityCounts[d.city] = (cityCounts[d.city] || 0) + 1
  })
  const cities = Object.entries(cityCounts)
    .map(([city, count]) => ({ value: city, label: city, count }))
    .sort((a, b) => b.count - a.count)

  // Get unique zip codes with counts
  const { data: zipData } = await supabase
    .from('properties')
    .select('zip')
  
  const zipCounts: Record<string, number> = {}
  zipData?.forEach((d: { zip: string | null }) => {
    if (d.zip) {
      zipCounts[d.zip] = (zipCounts[d.zip] || 0) + 1
    }
  })
  const zips = Object.entries(zipCounts)
    .map(([zip, count]) => ({ value: zip, label: zip, count }))
    .sort((a, b) => b.count - a.count)

  // Get unique statuses
  const { data: statusData } = await supabase
    .from('properties')
    .select('status')
  
  const statusCounts: Record<string, number> = {}
  statusData?.forEach((d: { status: string | null }) => {
    if (d.status) {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1
    }
  })
  const statuses = Object.entries(statusCounts)
    .map(([status, count]) => ({ value: status, label: status, count }))
    .sort((a, b) => b.count - a.count)

  // Get price range stats
  const { data: priceData } = await supabase
    .from('properties')
    .select('price')
  
  const prices = priceData?.map(d => d.price).filter(Boolean) as number[]
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 10000000

  // Get beds stats
  const { data: bedsData } = await supabase
    .from('properties')
    .select('beds')
  
  const bedsCounts: Record<number, number> = {}
  bedsData?.forEach((d: { beds: number | null }) => {
    if (d.beds) {
      bedsCounts[d.beds] = (bedsCounts[d.beds] || 0) + 1
    }
  })

  return {
    cities,
    zips,
    statuses,
    priceRange: { min: minPrice, max: maxPrice },
    bedsCounts
  }
}

async function getStats() {
  const [
    { count: totalLeads },
    { count: callablePhones },
    { count: totalEmails },
    { count: totalContacts }
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('phones').select('*', { count: 'exact', head: true }).eq('is_dnc', false),
    supabase.from('emails').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true })
  ])

  return {
    totalLeads: totalLeads || 0,
    callablePhones: callablePhones || 0,
    totalEmails: totalEmails || 0,
    totalContacts: totalContacts || 0
  }
}

export default async function NorLeadPage() {
  const [leads, filterOptions, stats] = await Promise.all([
    getSellerLeads(),
    getFilterOptions(),
    getStats()
  ])

  return (
    <NorLeadApp 
      initialLeads={leads as any}
      filterOptions={filterOptions}
      stats={stats}
    />
  )
}
