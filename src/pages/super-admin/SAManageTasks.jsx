import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import SAPageWrapper from '../../components/layout/SAPageWrapper'
import { useAuth } from '../../context/AuthContext'
import { todayISO } from '../../services/managerService'
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

  const displayedTasks = useMemo(
    () => filterTasksByStatus(tasks, filter),
    [tasks, filter],
  )

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task? This cannot be undone.')) return
    setDeletingId(taskId)
    try {
      await deleteTask(taskId)
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
                              onClick={() => handleDelete(task.id)}
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
    </SAPageWrapper>
  )
}
