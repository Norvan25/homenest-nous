import { createClient } from '@supabase/supabase-js'
import { Phone, Users, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// Users icon is already imported

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getStats() {
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })

  const { count: contactCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })

  const { count: phoneCount } = await supabase
    .from('phones')
    .select('*', { count: 'exact', head: true })
    .eq('is_dnc', false)

  return {
    properties: propertyCount || 0,
    contacts: contactCount || 0,
    callablePhones: phoneCount || 0,
  }
}

export default async function Dashboard() {
  const stats = await getStats()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good evening, Suzanna 👋
        </h1>
        <p className="text-white/50 mt-1">
          Here's what's happening with your leads today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Properties"
          value={stats.properties}
          icon={<TrendingUp className="text-norx" />}
          trend="+12%"
        />
        <StatCard
          label="Contacts"
          value={stats.contacts}
          icon={<Users className="text-norv" />}
        />
        <StatCard
          label="Callable Phones"
          value={stats.callablePhones}
          icon={<Phone className="text-norw" />}
        />
        <StatCard
          label="Appointments"
          value={0}
          icon={<Calendar className="text-norz" />}
          subtitle="This week"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/leads"
            className="bg-navy-800 border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-cyan-400" size={24} />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  Leads Dashboard
                </div>
                <div className="text-sm text-white/50">
                  {stats.properties} properties to work
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/norlead"
            className="bg-navy-800 border border-white/10 rounded-xl p-6 hover:border-gold-500/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-norx/20 rounded-lg flex items-center justify-center">
                <Phone className="text-norx" size={24} />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-gold-500 transition-colors">
                  Find Sellers
                </div>
                <div className="text-sm text-white/50">
                  {stats.callablePhones} numbers ready to call
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/norcall"
            className="bg-navy-800 border border-white/10 rounded-xl p-6 hover:border-gold-500/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-norv/20 rounded-lg flex items-center justify-center">
                <Phone className="text-norv" size={24} />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-gold-500 transition-colors">
                  Start Calling
                </div>
                <div className="text-sm text-white/50">
                  AI-powered outbound calls
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
          <div className="text-white/50 text-center py-8">
            No recent activity yet. Start by finding some leads!
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  trend,
  subtitle,
}: {
  label: string
  value: number
  icon: React.ReactNode
  trend?: string
  subtitle?: string
}) {
  return (
    <div className="bg-navy-800 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/50 mt-1">
        {label}
        {subtitle && <span className="text-white/30"> · {subtitle}</span>}
      </div>
    </div>
  )
}
