import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DevPageWrapper from '../../components/layout/DevPageWrapper'
import { useAuth } from '../../context/AuthContext'
import { usePresenceBroadcast } from '../../hooks/useOnlinePresence'
import { fetchDeveloperTasks, sortTasks } from '../../services/developerService'
import {
  filterTasksByStatus,
  formatDate,
  getDeadlineBadge,
  getDeadlineRowClass,
  getDeadlineStatus,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TASK_FILTERS,
} from '../../utils/taskUtils'

function FilterTabs({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TASK_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
            active === f
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-white/40 hover:bg-white/5 hover:text-white/70'
          }`}
        >
          {f === 'all' ? 'All' : f.replace('_', ' ')}
        </button>
      ))}
    </div>
  )
}

export default function DEVMyTasks() {
  const { profile } = useAuth()
  usePresenceBroadcast(profile)

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('deadline')

  const loadTasks = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const data = await fetchDeveloperTasks(profile.id)
    setTasks(data)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const displayedTasks = useMemo(() => {
    const filtered = filterTasksByStatus(tasks, filter)
    return sortTasks(filtered, sortBy)
  }, [tasks, filter, sortBy])

  return (
    <DevPageWrapper>
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Tasks</h1>
          <p className="text-sm text-white/50">All tasks assigned to you</p>
        </div>

        <div className="glass-panel p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <FilterTabs active={filter} onChange={setFilter} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
            >
              <option value="deadline">By Deadline (soonest first)</option>
              <option value="priority">By Priority (high first)</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            </div>
          ) : displayedTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No tasks found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Project</th>
                    <th className="pb-3 pr-4 font-medium">Priority</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Allocated At</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTasks.map((task) => {
                    const deadlineStatus = getDeadlineStatus(task.deadline, task.status)
                    const badge = getDeadlineBadge(deadlineStatus)
                    const rowClass = getDeadlineRowClass(deadlineStatus)

                    return (
                      <tr key={task.id} className={`border-b border-white/5 ${rowClass}`}>
                        <td className="py-4 pr-4">
                          <Link
                            to={`/developer/tasks/${task.id}`}
                            className="flex items-center gap-2 hover:text-emerald-400"
                          >
                            <span className="text-white">{task.title}</span>
                            {badge && (
                              <span className={`rounded-full px-2 py-0.5 text-xs ${badge.className}`}>
                                {badge.label}
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="py-4 pr-4 text-white/60">
                          {task.project?.name || 'No project'}
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_COLORS[task.priority]}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[task.status]}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-white/50">{formatDate(task.deadline)}</td>
                        <td className="py-4 text-white/50">{formatDate(task.allocated_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DevPageWrapper>
  )
}
