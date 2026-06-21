import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, CheckSquare, Clock } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import { useAuth } from '../../context/AuthContext'
import { usePresenceBroadcast } from '../../hooks/useOnlinePresence'
import { supabase } from '../../services/supabase'
import {
  filterTasksByStatus,
  formatDate,
  getDeadlineBadge,
  getDeadlineStatus,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TASK_FILTERS,
} from '../../utils/taskUtils'

// ── Filter tabs ────────────────────────────────────────────────────────────────
function FilterTabs({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TASK_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
            active === f
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-white/40 hover:bg-white/5 hover:text-white/70'
          }`}
        >
          {f === 'all' ? 'All' : f.replace('_', ' ')}
        </button>
      ))}
    </div>
  )
}

// ── Task card ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onMarkComplete, completing }) {
  const deadlineStatus = getDeadlineStatus(task.deadline, task.status)
  const badge = getDeadlineBadge(deadlineStatus)

  const borderAccent =
    deadlineStatus === 'overdue'
      ? 'border-l-4 border-l-red-500'
      : deadlineStatus === 'due_today'
        ? 'border-l-4 border-l-amber-500'
        : 'border-l-4 border-l-transparent'

  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-gray-900/50 p-6 transition-all hover:border-white/20 ${borderAccent}`}
    >
      {/* Title row */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-white">{task.title}</h3>
          {badge && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="mb-4 line-clamp-2 text-sm text-white/50">{task.description}</p>
      )}

      {/* Dates */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Due: <span className="text-white/60">{formatDate(task.deadline)}</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Clock className="h-3.5 w-3.5" />
          <span>Assigned: <span className="text-white/60">{formatDate(task.allocated_at || task.created_at)}</span></span>
        </div>
      </div>

      {/* Action */}
      {task.status === 'completed' ? (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Completed ✓
        </div>
      ) : (
        <button
          onClick={() => onMarkComplete(task)}
          disabled={completing === task.id}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {completing === task.id ? (
            <div className="h-4 w-4 animate-spin rounded-full border border-emerald-400/30 border-t-emerald-400" />
          ) : (
            <CheckSquare className="h-4 w-4" />
          )}
          {completing === task.id ? 'Marking…' : 'Mark as Complete'}
        </button>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MGRMyTasks() {
  const { profile } = useAuth()
  usePresenceBroadcast(profile)

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [completing, setCompleting] = useState(null) // task id being completed

  const loadTasks = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', profile.id)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Realtime — refresh when any task changes
  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel('mgr-my-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `assignee_id=eq.${profile.id}` },
        () => loadTasks(),
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profile?.id, loadTasks])

  const handleMarkComplete = async (task) => {
    setCompleting(task.id)

    // 1. Update task status
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id)

    // 2. Notify all super_admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'super_admin')
      .eq('is_active', true)

    if (admins?.length) {
      const managerName = profile.full_name || profile.email || 'A manager'
      await supabase.from('notifications').insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: 'Task Completed',
          message: `${managerName} completed: ${task.title}`,
          type: 'status_update',
          related_task_id: task.id,
        })),
      )
    }

    setCompleting(null)
    loadTasks()
  }

  const displayed = useMemo(() => filterTasksByStatus(tasks, filter), [tasks, filter])

  return (
    <PageWrapper>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">My Tasks</h1>
          <p className="text-sm text-white/50">Tasks assigned to you by Super Admin</p>
        </div>

        {/* Filter tabs */}
        <FilterTabs active={filter} onChange={setFilter} />

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="glass-panel flex flex-col items-center py-20 text-center">
            <CheckSquare className="mb-4 h-12 w-12 text-white/20" />
            <p className="text-white/40">
              {filter === 'all'
                ? 'No tasks assigned to you yet'
                : `No ${filter.replace('_', ' ')} tasks`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {displayed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onMarkComplete={handleMarkComplete}
                completing={completing}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
