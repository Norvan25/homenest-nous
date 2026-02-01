'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Building2,
  Phone,
  Mail,
  Users,
  Star,
  MessageSquare,
  Calendar,
  CheckCircle,
  Flame,
  Clock,
  PhoneCall,
  FileText,
  TrendingUp,
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DashboardData {
  norLead: {
    totalProperties: number
    callablePhones: number
    totalEmails: number
    totalContacts: number
  }
  crm: {
    total: number
    new: number
    contacted: number
    interested: number
    appointment: number
    closed: number
  }
  followUps: {
    count: number
    items: any[]
  }
  hotLeads: {
    count: number
    items: any[]
  }
  activities: any[]
  performance: {
    callsMade: number
    contactsReached: number
    appointmentsSet: number
  }
}

interface Props {
  initialData: DashboardData
}

export default function Dashboard({ initialData }: Props) {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [
        { count: totalProperties },
        { count: callablePhones },
        { count: totalEmails },
        { count: totalContacts },
        { count: inCrm },
        { count: crmNew },
        { count: crmContacted },
        { count: crmInterested },
        { count: crmAppointment },
        { count: crmClosed },
        { data: followUpsToday, count: followUpCount },
        { data: hotLeads, count: hotCount },
        { data: recentActivities },
        { count: callsMade },
        { count: contactsReached },
        { count: appointmentsSet },
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('phones').select('*', { count: 'exact', head: true }).eq('is_dnc', false),
        supabase.from('emails').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }),
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'interested'),
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'appointment'),
        supabase.from('crm_leads').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
        supabase
          .from('crm_leads')
          .select('*, properties(street_address, city)', { count: 'exact' })
          .lte('next_action_date', today + 'T23:59:59')
          .gte('next_action_date', today + 'T00:00:00')
          .order('next_action_date', { ascending: true })
          .limit(5),
        supabase
          .from('crm_leads')
          .select('*, properties(street_address, city)', { count: 'exact' })
          .eq('priority', 'hot')
          .limit(5),
        supabase
          .from('crm_activities')
          .select('*, crm_leads(property_id, properties(street_address, city))')
          .order('created_at', { ascending: false })
          .limit(10),
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

      setData({
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
      })
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
    setIsRefreshing(false)
  }

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 60000)
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneCall size={14} className="text-emerald-400" />
      case 'email': return <Mail size={14} className="text-amber-400" />
      case 'note': return <FileText size={14} className="text-blue-400" />
      default: return <Calendar size={14} className="text-purple-400" />
    }
  }

  const getActivityText = (activity: any) => {
    const address = activity.crm_leads?.properties?.street_address || 'Unknown'
    const city = activity.crm_leads?.properties?.city || ''
    const location = city ? `${address}, ${city}` : address

    switch (activity.activity_type) {
      case 'call':
        const outcome = activity.outcome?.replace(':', ' → ') || 'no outcome'
        return `Called ${location} - ${outcome}`
      case 'email':
        return `Emailed ${location}`
      case 'note':
        return `Note added to ${location}`
      default:
        return `Activity on ${location}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, Suzanna 👋
          </h1>
          <p className="text-white/50 mt-1">
            Here's what's happening with your leads today.
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors text-sm"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : `Updated ${formatRelativeTime(lastRefresh.toISOString())}`}
        </button>
      </div>

      {/* Stats Section */}
      <div className="space-y-4">
        {/* Row 1: NorLead Pipeline */}
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Building2 size={12} />
            NorLead Pipeline
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Properties"
              value={data.norLead.totalProperties}
              icon={<Building2 size={18} />}
              color="blue"
              href="/norlead"
            />
            <StatCard
              label="Callable Phones"
              value={data.norLead.callablePhones}
              icon={<Phone size={18} />}
              color="blue"
              href="/norlead"
            />
            <StatCard
              label="Emails"
              value={data.norLead.totalEmails}
              icon={<Mail size={18} />}
              color="blue"
              href="/norlead"
            />
            <StatCard
              label="Contacts"
              value={data.norLead.totalContacts}
              icon={<Users size={18} />}
              color="blue"
              href="/norlead"
            />
          </div>
        </div>

        {/* Row 2: CRM Active Work */}
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Zap size={12} />
            CRM Active Work
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <StatCard
              label="In CRM"
              value={data.crm.total}
              icon={<Users size={18} />}
              color="cyan"
              href="/norcrm"
            />
            <StatCard
              label="New"
              value={data.crm.new}
              icon={<Star size={18} />}
              color="cyan"
              href="/norcrm?status=new"
            />
            <StatCard
              label="Contacted"
              value={data.crm.contacted}
              icon={<Phone size={18} />}
              color="cyan"
              href="/norcrm?status=contacted"
            />
            <StatCard
              label="Interested"
              value={data.crm.interested}
              icon={<MessageSquare size={18} />}
              color="cyan"
              href="/norcrm?status=interested"
            />
            <StatCard
              label="Appointments"
              value={data.crm.appointment}
              icon={<Calendar size={18} />}
              color="cyan"
              href="/norcrm?status=appointment"
            />
            <StatCard
              label="Closed"
              value={data.crm.closed}
              icon={<CheckCircle size={18} />}
              color="cyan"
              href="/norcrm?status=closed"
            />
          </div>
        </div>
      </div>

      {/* Today's Priorities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Follow-ups Due Today */}
        <div className={`bg-navy-800 border rounded-xl overflow-hidden ${
          data.followUps.count > 0 ? 'border-orange-500/30' : 'border-white/10'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                data.followUps.count > 0 ? 'bg-orange-500/20' : 'bg-white/10'
              }`}>
                <Clock size={20} className={data.followUps.count > 0 ? 'text-orange-400' : 'text-white/50'} />
              </div>
              <div>
                <div className="font-semibold text-white">Follow-ups Due Today</div>
                <div className={`text-sm ${data.followUps.count > 0 ? 'text-orange-400' : 'text-white/50'}`}>
                  {data.followUps.count} lead{data.followUps.count !== 1 ? 's' : ''} need attention
                </div>
              </div>
            </div>
            {data.followUps.count > 0 && (
              <Link
                href="/norcrm?followup=today"
                className="text-sm text-orange-400 hover:underline"
              >
                View all
              </Link>
            )}
          </div>
          <div className="p-4">
            {data.followUps.items.length === 0 ? (
              <div className="text-center py-4 text-white/40">
                No follow-ups scheduled for today
              </div>
            ) : (
              <div className="space-y-2">
                {data.followUps.items.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/norcrm?lead=${item.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <div className="text-white text-sm font-medium">
                        {item.properties?.street_address || 'Unknown'}
                      </div>
                      <div className="text-white/50 text-xs">
                        {item.next_action || 'Follow up'}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/30" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hot Leads */}
        <div className={`bg-navy-800 border rounded-xl overflow-hidden ${
          data.hotLeads.count > 0 ? 'border-red-500/30' : 'border-white/10'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                data.hotLeads.count > 0 ? 'bg-red-500/20' : 'bg-white/10'
              }`}>
                <Flame size={20} className={data.hotLeads.count > 0 ? 'text-red-400' : 'text-white/50'} />
              </div>
              <div>
                <div className="font-semibold text-white">Hot Leads</div>
                <div className={`text-sm ${data.hotLeads.count > 0 ? 'text-red-400' : 'text-white/50'}`}>
                  {data.hotLeads.count} high priority lead{data.hotLeads.count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            {data.hotLeads.count > 0 && (
              <Link
                href="/norcrm?priority=hot"
                className="text-sm text-red-400 hover:underline"
              >
                View all
              </Link>
            )}
          </div>
          <div className="p-4">
            {data.hotLeads.items.length === 0 ? (
              <div className="text-center py-4 text-white/40">
                No hot leads at the moment
              </div>
            ) : (
              <div className="space-y-2">
                {data.hotLeads.items.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/norcrm?lead=${item.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Flame size={14} className="text-red-400" />
                      <div>
                        <div className="text-white text-sm font-medium">
                          {item.properties?.street_address || 'Unknown'}
                        </div>
                        <div className="text-white/50 text-xs capitalize">
                          {item.status}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/30" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-navy-800 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-white/50" />
            </div>
            <div>
              <div className="font-semibold text-white">Recent Activity</div>
              <div className="text-sm text-white/50">Your latest interactions</div>
            </div>
          </div>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {data.activities.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              No recent activity. Start by calling some leads!
            </div>
          ) : (
            <div className="space-y-3">
              {data.activities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      {getActivityText(activity)}
                    </div>
                    {activity.notes && (
                      <div className="text-xs text-white/50 mt-1 truncate">
                        {activity.notes}
                      </div>
                    )}
                    <div className="text-xs text-white/30 mt-1">
                      {formatRelativeTime(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/norlead"
            className="bg-navy-800 border border-white/10 rounded-xl p-6 hover:border-norx/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-norx/20 rounded-lg flex items-center justify-center">
                <Building2 className="text-norx" size={24} />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-norx transition-colors">
                  Find Sellers
                </div>
                <div className="text-sm text-white/50">
                  {data.norLead.callablePhones} numbers ready
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/norcrm"
            className="bg-navy-800 border border-white/10 rounded-xl p-6 hover:border-norv/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-norv/20 rounded-lg flex items-center justify-center">
                <Users className="text-norv" size={24} />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-norv transition-colors">
                  Manage CRM
                </div>
                <div className="text-sm text-white/50">
                  {data.crm.total} active leads
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/norcrm?status=new"
            className="bg-navy-800 border border-white/10 rounded-xl p-6 hover:border-norv/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-norv/20 rounded-lg flex items-center justify-center">
                <Phone className="text-norv" size={24} />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-norv transition-colors">
                  Start Calling
                </div>
                <div className="text-sm text-white/50">
                  {data.crm.new} new leads to contact
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Performance This Week */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Performance This Week</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <PhoneCall size={16} className="text-emerald-400" />
              <span className="text-sm text-white/50">Calls Made</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {data.performance.callsMade}
            </div>
          </div>

          <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare size={16} className="text-cyan-400" />
              <span className="text-sm text-white/50">Contacts Reached</span>
            </div>
            <div className="text-3xl font-bold text-cyan-400">
              {data.performance.contactsReached}
            </div>
          </div>

          <div className="bg-navy-800 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={16} className="text-purple-400" />
              <span className="text-sm text-white/50">Appointments</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {data.performance.appointmentsSet}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
  href
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'cyan'
  href: string
}) {
  const bgColor = color === 'blue' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-cyan-500/5 border-cyan-500/20'
  const iconColor = color === 'blue' ? 'text-blue-400' : 'text-cyan-400'
  const hoverColor = color === 'blue' ? 'hover:border-blue-500/40' : 'hover:border-cyan-500/40'

  return (
    <Link
      href={href}
      className={`${bgColor} ${hoverColor} border rounded-xl p-4 transition-colors group`}
    >
      <div className={`${iconColor} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-white/50">{label}</div>
    </Link>
  )
}
