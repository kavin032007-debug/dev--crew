import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckSquare, Clock, FolderKanban, Layers } from 'lucide-react'
import DevPageWrapper from '../../components/layout/DevPageWrapper'
import { useAuth } from '../../context/AuthContext'
import { usePresenceBroadcast } from '../../hooks/useOnlinePresence'
import {
  fetchDeveloperProjectCount,
  fetchDeveloperTasks,
  getActiveTasks,
  getDueSoonTasks,
} from '../../services/developerService'
import {
  formatDate,
  getDeadlineBadge,
  getDeadlineRowClass,
  getDeadlineStatus,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../../utils/taskUtils'

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

function TaskPreviewRow({ task }) {
  const deadlineStatus = getDeadlineStatus(task.deadline, task.status)
  const badge = getDeadlineBadge(deadlineStatus)
  const rowClass = getDeadlineRowClass(deadlineStatus)

  return (
    <Link
      to={`/developer/tasks/${task.id}`}
      className={`flex items-center justify-between rounded-xl border border-white/5 px-4 py-3 transition-all hover:bg-white/[0.04] ${rowClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-white">{task.title}</p>
          {badge && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <p className="text-xs text-white/40">{task.project?.name || 'No project'}</p>
      </div>
      <div className="ml-4 flex items-center gap-3">
        <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_COLORS[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
        <span className="text-xs text-white/40">{formatDate(task.deadline)}</span>
      </div>
    </Link>
  )
}

export default function DEVDashboard() {
  const { profile } = useAuth()
  usePresenceBroadcast(profile)

  const [stats, setStats] = useState({
    projects: 0,
    total: 0,
    pending: 0,
    completed: 0,
  })
  const [dueSoon, setDueSoon] = useState([])
  const [activeTasks, setActiveTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)

    const [tasks, projectCount] = await Promise.all([
      fetchDeveloperTasks(profile.id),
      fetchDeveloperProjectCount(profile.id),
    ])

    setStats({
      projects: projectCount,
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    })
    setDueSoon(getDueSoonTasks(tasks))
    setActiveTasks(getActiveTasks(tasks).slice(0, 8))
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <DevPageWrapper>
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Developer Dashboard</h1>
          <p className="text-sm text-white/50">Welcome, {profile?.full_name || profile?.email}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FolderKanban}
            label="My Projects"
            value={stats.projects}
            loading={loading}
            accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={Layers}
            label="Total Tasks"
            value={stats.total}
            loading={loading}
            accent="border-blue-500/20 bg-blue-500/10 text-blue-400"
          />
          <StatCard
            icon={Clock}
            label="Pending Tasks"
            value={stats.pending}
            loading={loading}
            accent="border-amber-500/20 bg-amber-500/10 text-amber-400"
          />
          <StatCard
            icon={CheckSquare}
            label="Completed Tasks"
            value={stats.completed}
            loading={loading}
            accent="border-violet-500/20 bg-violet-500/10 text-violet-400"
          />
        </div>

        <div className="glass-panel p-8">
          <div className="mb-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Due Soon</h2>
            <span className="text-xs text-white/40">Within the next 3 days</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            </div>
          ) : dueSoon.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2">
              {dueSoon.map((task) => (
                <TaskPreviewRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">My Active Tasks</h2>
            <Link
              to="/developer/tasks"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            </div>
          ) : activeTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">No active tasks</p>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <TaskPreviewRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DevPageWrapper>
  )
}
