import { useCallback, useEffect, useState } from 'react'
import { Activity, CheckSquare, FolderKanban, Layers } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import { useAuth } from '../../context/AuthContext'
import { usePresenceBroadcast } from '../../hooks/useOnlinePresence'
import { fetchManagerProjects, fetchManagerTasks } from '../../services/managerService'
import { supabase } from '../../services/supabase'
import { calculateProjectProgress } from '../../utils/projectProgress'
import { formatDate, STATUS_COLORS, STATUS_LABELS } from '../../utils/taskUtils'

function StatCard({ icon: Icon, label, value, accent, loading }) {
  return (
    <div className="glass-panel p-6">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}>
        <Icon className="h-5 w-5" />
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

export default function MGRDashboard() {
  const { profile } = useAuth()
  usePresenceBroadcast(profile)

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
  })
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)

    const [projects, tasks] = await Promise.all([
      fetchManagerProjects(profile.id),
      fetchManagerTasks(profile.id),
    ])

    const tasksByProject = {}
    tasks.forEach((t) => {
      if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = []
      tasksByProject[t.project_id].push(t)
    })

    const activeProjects = projects.filter((p) => {
      const projectTasks = tasksByProject[p.id] || []
      const { progress } = calculateProjectProgress(projectTasks)
      return projectTasks.length === 0 || progress < 100
    }).length

    setStats({
      totalProjects: projects.length,
      activeProjects,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t) => t.status === 'pending').length,
    })

    setActivity(tasks.slice(0, 10))
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('manager-task-activity')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => loadData(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, loadData])

  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Manager Dashboard</h1>
          <p className="text-sm text-white/50">Welcome, {profile?.full_name || profile?.email}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FolderKanban}
            label="Total Projects"
            value={stats.totalProjects}
            loading={loading}
            accent="border-blue-500/20 bg-blue-500/10 text-blue-400"
          />
          <StatCard
            icon={Layers}
            label="Active Projects"
            value={stats.activeProjects}
            loading={loading}
            accent="border-violet-500/20 bg-violet-500/10 text-violet-400"
          />
          <StatCard
            icon={CheckSquare}
            label="Total Tasks"
            value={stats.totalTasks}
            loading={loading}
            accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={Activity}
            label="Pending Tasks"
            value={stats.pendingTasks}
            loading={loading}
            accent="border-amber-500/20 bg-amber-500/10 text-amber-400"
          />
        </div>

        <div className="glass-panel p-8">
          <div className="mb-6 flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Live Task Activity</h2>
            <div className="pulse-dot ml-1 h-2 w-2" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
            </div>
          ) : activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No task activity yet</p>
          ) : (
            <div className="space-y-3">
              {activity.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{task.title}</p>
                    <p className="text-xs text-white/40">
                      {task.project?.name || 'Project'} · {task.assignee?.full_name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_COLORS[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                    <span className="text-xs text-white/40">{formatDate(task.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
