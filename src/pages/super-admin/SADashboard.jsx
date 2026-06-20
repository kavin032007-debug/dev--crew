import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  CheckSquare,
  Code2,
  FolderKanban,
  Shield,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import SAPageWrapper from '../../components/layout/SAPageWrapper'
import { useAuth } from '../../context/AuthContext'
import { usePresenceSubscribe } from '../../hooks/useOnlinePresence'
import { supabase } from '../../services/supabase'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatCard({ icon: Icon, label, value, accent, loading }) {
  return (
    <div className="glass-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="text-3xl font-bold text-white">{value}</p>
      )}
      <p className="mt-1 text-sm text-white/50">{label}</p>
    </div>
  )
}

function PresenceCard({ label, count, accent, icon: Icon }) {
  return (
    <div className="glass-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="pulse-dot flex h-2 w-2 items-center justify-center">
          <span className="sr-only">Live</span>
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{count}</p>
      <p className="mt-1 text-sm text-white/50">{label}</p>
    </div>
  )
}

export default function SADashboard() {
  const { profile } = useAuth()
  const presence = usePresenceSubscribe()

  const [stats, setStats] = useState({
    managers: 0,
    developers: 0,
    projects: 0,
    tasks: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [recentSignups, setRecentSignups] = useState([])
  const [loadingSignups, setLoadingSignups] = useState(true)
  const [pendingRequests, setPendingRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [actionId, setActionId] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    const [managers, developers, projects, tasks] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'manager'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'developer'),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      managers: managers.count ?? 0,
      developers: developers.count ?? 0,
      projects: projects.count ?? 0,
      tasks: tasks.count ?? 0,
    })
    setLoadingStats(false)
  }, [])

  const fetchRecentSignups = useCallback(async () => {
    setLoadingSignups(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error) setRecentSignups(data || [])
    setLoadingSignups(false)
  }, [])

  const fetchPendingRequests = useCallback(async () => {
    setLoadingRequests(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .is('role', null)
      .eq('is_active', false)
      .order('created_at', { ascending: false })

    if (!error) setPendingRequests(data || [])
    setLoadingRequests(false)
  }, [])

  useEffect(() => {
    fetchStats()
    fetchRecentSignups()
    fetchPendingRequests()
  }, [fetchStats, fetchRecentSignups, fetchPendingRequests])

  const handleAccept = async (user) => {
    if (!user.pending_role) return
    setActionId(user.id)

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: user.pending_role, is_active: true, pending_role: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to accept request:', updateError.message)
      setActionId(null)
      return
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Request approved',
      message: `Your request to join as ${user.pending_role.replace('_', ' ')} has been approved.`,
      type: 'request_approved',
    })

    await Promise.all([fetchPendingRequests(), fetchStats(), fetchRecentSignups()])
    setActionId(null)
  }

  const handleReject = async (user) => {
    setActionId(user.id)

    if (user.pending_role) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Request rejected',
        message: `Your request to join as ${user.pending_role.replace('_', ' ')} has been rejected.`,
        type: 'request_rejected',
      })
    }

    const { error } = await supabase.from('users').delete().eq('id', user.id)

    if (!error) {
      await Promise.all([fetchPendingRequests(), fetchRecentSignups()])
    }
    setActionId(null)
  }

  return (
    <SAPageWrapper>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
            <Shield className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Super Admin Dashboard</h1>
            <p className="text-sm text-white/50">
              Welcome, {profile?.full_name || profile?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Managers"
            value={stats.managers}
            loading={loadingStats}
            accent="border-blue-500/20 bg-blue-500/10 text-blue-400"
          />
          <StatCard
            icon={Code2}
            label="Total Developers"
            value={stats.developers}
            loading={loadingStats}
            accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={FolderKanban}
            label="Total Projects"
            value={stats.projects}
            loading={loadingStats}
            accent="border-violet-500/20 bg-violet-500/10 text-violet-400"
          />
          <StatCard
            icon={CheckSquare}
            label="Total Tasks"
            value={stats.tasks}
            loading={loadingStats}
            accent="border-amber-500/20 bg-amber-500/10 text-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PresenceCard
            icon={Users}
            label="Active Managers"
            count={presence.managers}
            accent="border-blue-500/20 bg-blue-500/10 text-blue-400"
          />
          <PresenceCard
            icon={Code2}
            label="Active Developers"
            count={presence.developers}
            accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          />
        </div>

        <div className="glass-panel p-8">
          <h2 className="mb-6 text-lg font-semibold text-white">Recent Signups</h2>
          {loadingSignups ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
            </div>
          ) : recentSignups.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="pb-3 pr-4 font-medium">Avatar</th>
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 font-medium">Joined At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSignups.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 last:border-0">
                      <td className="py-4 pr-4">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full border border-white/10"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/50">
                            {(user.full_name || user.email)?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-white">{user.full_name || '—'}</td>
                      <td className="py-4 pr-4 text-white/60">{user.email}</td>
                      <td className="py-4 pr-4">
                        <span className="capitalize text-white/80">
                          {user.role?.replace('_', ' ') || user.pending_role?.replace('_', ' ') || 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 text-white/50">{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-panel p-8">
          <div className="mb-6 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Pending Join Requests</h2>
            {pendingRequests.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                {pendingRequests.length}
              </span>
            )}
          </div>

          {loadingRequests ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No pending requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Requested Role</th>
                    <th className="pb-3 pr-4 font-medium">Requested At</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 last:border-0">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full border border-white/10"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/50">
                              {(user.full_name || user.email)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-white">{user.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-white/60">{user.email}</td>
                      <td className="py-4 pr-4">
                        <span className="capitalize text-white/80">
                          {user.pending_role?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-white/50">{formatDate(user.created_at)}</td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(user)}
                            disabled={actionId === user.id}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(user)}
                            disabled={actionId === user.id}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SAPageWrapper>
  )
}
