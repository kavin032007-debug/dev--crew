import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageSquare, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SAPageWrapper from '../../components/layout/SAPageWrapper'
import { useAuth } from '../../context/AuthContext'
import { todayISO } from '../../services/managerService'
import { supabase } from '../../services/supabase'
import {
  createTask,
  deleteTask,
  fetchActiveManagersAndDevelopers,
  fetchAllProjects,
  fetchAllTasks,
  updateTask,
} from '../../services/superAdminService'
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
              ? 'bg-violet-500/20 text-violet-400'
              : 'text-white/40 hover:bg-white/5 hover:text-white/70'
          }`}
        >
          {f === 'all' ? 'All' : f.replace('_', ' ')}
        </button>
      ))}
    </div>
  )
}

const ROLE_BADGE = {
  super_admin: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  manager: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  developer: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

function ThreadModal({ task, onClose }) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)

  const loadResponses = useCallback(async () => {
    if (!task) return
    const { data } = await supabase
      .from('task_responses')
      .select('*, user:users(id, full_name, email, avatar_url, role)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    setResponses(data || [])
    setLoading(false)

    // Realtime subscription
    const channel = supabase
      .channel(`thread-${task.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_responses', filter: `task_id=eq.${task.id}` },
        async (payload) => {
          const { data: newRow } = await supabase
            .from('task_responses')
            .select('*, user:users(id, full_name, email, avatar_url, role)')
            .eq('id', payload.new.id)
            .single()
          if (newRow) setResponses((prev) => [...prev, newRow])
        },
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [task])

  useEffect(() => {
    let cleanup
    loadResponses().then((fn) => { cleanup = fn })
    return () => cleanup?.()
  }, [loadResponses])

  if (!task) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <h2 className="text-base font-semibold text-white">{task.title}</h2>
            {task.description && (
              <p className="mt-1 text-xs text-white/40 line-clamp-2">{task.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
            </div>
          ) : responses.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/40">No responses yet.</p>
          ) : (
            responses.map((r) => (
              <div key={r.id} className="flex gap-3">
                {/* Avatar */}
                {r.user?.avatar_url ? (
                  <img src={r.user.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white/10" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/60">
                    {(r.user?.full_name || r.user?.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {r.user?.full_name || r.user?.email || 'Unknown'}
                    </span>
                    {r.user?.role && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${ROLE_BADGE[r.user.role] || 'bg-white/10 text-white/40 border-white/20'}`}>
                        {r.user.role.replace('_', ' ')}
                      </span>
                    )}
                    <span className="text-xs text-white/30">
                      {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="rounded-xl rounded-tl-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80 leading-relaxed">
                    {r.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Read-only footer */}
        <div className="border-t border-white/10 px-6 py-3">
          <p className="text-center text-xs text-white/30">Read-only view — only developers can post responses</p>
        </div>
      </div>
    </div>
  )
}

function TaskModal({ open, onClose, onSaved, task, assignees, projects, userId }) {
  const isEdit = Boolean(task)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setTitle(task?.title || '')
      setDescription(task?.description || '')
      setAssigneeId(task?.assignee_id || '')
      setProjectId(task?.project_id || '')
      setDeadline(task?.deadline || todayISO())
      setPriority(task?.priority || 'medium')
      setError(null)
    }
  }, [open, task])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !deadline) return
    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      assignee_id: assigneeId || null,
      project_id: projectId || null,
      deadline,
      priority,
    }

    try {
      if (isEdit) {
        await updateTask(task.id, payload)
      } else {
        await createTask(payload, userId)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">
          {isEdit ? 'Edit Task' : 'Create Task'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Assign To</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="">Unassigned</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} ({u.role?.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Project (optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Due Date *</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Allocation Date</label>
              <input
                type="date"
                value={isEdit ? task?.allocated_at : todayISO()}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white/40"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-violet-500/20 px-4 py-2.5 text-sm font-medium text-violet-400 hover:bg-violet-500/30 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SAManageTasks() {
  const { profile } = useAuth()

  const [tasks, setTasks] = useState([])
  const [assignees, setAssignees] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // taskId to delete
  const [viewingThread, setViewingThread] = useState(null) // task object
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [taskList, userList, projectList] = await Promise.all([
      fetchAllTasks(),
      fetchActiveManagersAndDevelopers(),
      fetchAllProjects(),
    ])
    setTasks(taskList)
    setAssignees(userList)
    setProjects(projectList)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const displayedTasks = useMemo(() => {
    const byStatus = filterTasksByStatus(tasks, filter)
    if (!searchQuery.trim()) return byStatus
    const q = searchQuery.toLowerCase()
    return byStatus.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.assignee?.full_name || t.assignee?.email || '').toLowerCase().includes(q),
    )
  }, [tasks, filter, searchQuery])

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete)
    setConfirmDelete(null)
    try {
      await deleteTask(confirmDelete)
      await loadData()
    } catch (err) {
      console.error('Failed to delete task:', err.message)
    }
    setDeletingId(null)
  }

  return (
    <SAPageWrapper>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Task Management</h1>
            <p className="text-sm text-white/50">All tasks across projects and users</p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-400 hover:bg-violet-500/20"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        </div>

        <div className="glass-panel p-8">
          {/* Search bar */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or assignee…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-500/40 focus:bg-white/[0.07] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mb-6">
            <FilterTabs active={filter} onChange={setFilter} />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
            </div>
          ) : displayedTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No tasks found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Assignee</th>
                    <th className="pb-3 pr-4 font-medium">Project</th>
                    <th className="pb-3 pr-4 font-medium">Priority</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Due Date</th>
                    <th className="pb-3 pr-4 font-medium">Allocated At</th>
                    <th className="pb-3 pr-4 font-medium">Thread</th>
                    <th className="pb-3 font-medium">Actions</th>
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
                          <div className="flex items-center gap-2">
                            <span className="text-white">{task.title}</span>
                            {badge && (
                              <span className={`rounded-full px-2 py-0.5 text-xs ${badge.className}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-white/60">
                          {task.assignee ? (
                            <span>
                              {task.assignee.full_name || task.assignee.email}
                              <span className="ml-1 text-xs capitalize text-white/40">
                                ({task.assignee.role?.replace('_', ' ')})
                              </span>
                            </span>
                          ) : (
                            'Unassigned'
                          )}
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
                        <td className="py-4 pr-4 text-white/50">{formatDate(task.allocated_at)}</td>
                        <td className="py-4 pr-4">
                          <button
                            onClick={() => setViewingThread(task)}
                            className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 px-2.5 py-1.5 text-xs text-violet-400 hover:bg-violet-500/10"
                          >
                            <MessageSquare className="h-3 w-3" />
                            View
                          </button>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingTask(task)
                                setShowModal(true)
                              }}
                              className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(task.id)}
                              disabled={deletingId === task.id}
                              className="rounded-lg border border-red-500/20 p-1.5 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <TaskModal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingTask(null)
        }}
        onSaved={loadData}
        task={editingTask}
        assignees={assignees}
        projects={projects}
        userId={profile?.id}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ThreadModal
        task={viewingThread}
        onClose={() => setViewingThread(null)}
      />
    </SAPageWrapper>
  )
}
