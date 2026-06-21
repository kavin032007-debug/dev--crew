import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2, UserMinus, UserPlus } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import ProjectProgressBar from '../../components/ProjectProgressBar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import { usePresenceBroadcast } from '../../hooks/useOnlinePresence'
import {
  fetchActiveDevelopers,
  fetchProjectDevelopers,
  fetchProjectTasks,
  notifyTaskAssigned,
  todayISO,
} from '../../services/managerService'
import { sendEmail } from '../../services/notificationService'
import { supabase } from '../../services/supabase'
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

function TaskModal({ open, onClose, onSaved, projectId, developers, task, userId }) {
  const isEdit = Boolean(task)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setTitle(task?.title || '')
      setDescription(task?.description || '')
      setAssigneeId(task?.assignee_id || '')
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

    if (isEdit) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          assignee_id: assigneeId || null,
          deadline,
          priority,
        })
        .eq('id', task.id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      // Feature 5: Notify assignee if deadline changed
      const deadlineChanged = task.deadline !== deadline
      const effectiveAssignee = assigneeId || task.assignee_id
      if (deadlineChanged && effectiveAssignee) {
        const formattedDeadline = new Date(deadline).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
        const notifTitle = 'Task deadline updated'
        const notifMsg = `Deadline for "${title.trim()}" changed to ${formattedDeadline}`

        await supabase.from('notifications').insert({
          user_id: effectiveAssignee,
          title: notifTitle,
          message: notifMsg,
          type: 'status_update',
          related_task_id: task.id,
        })

        // Send email to assignee
        const { data: assigneeUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', effectiveAssignee)
          .single()
        if (assigneeUser?.email) {
          await sendEmail(assigneeUser.email, notifTitle, notifMsg)
        }
      }
    } else {
      const { data: newTask, error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          project_id: projectId,
          assignee_id: assigneeId || null,
          created_by: userId,
          deadline,
          priority,
          allocated_at: todayISO(),
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }

      if (assigneeId) {
        await notifyTaskAssigned(assigneeId, title.trim(), newTask.id)
      }
    }

    onSaved()
    onClose()
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Assign To</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
            >
              <option value="">Unassigned</option>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name || d.email}
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
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
              className="flex-1 rounded-xl bg-blue-500/20 px-4 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/30 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MGRProjectDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  usePresenceBroadcast(profile)

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [allDevelopers, setAllDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedDev, setSelectedDev] = useState('')
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false)

  const loadProject = useCallback(async () => {
    setLoading(true)

    const [{ data: projectData }, taskList, devMembers, allDevs] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      fetchProjectTasks(id),
      fetchProjectDevelopers(id),
      fetchActiveDevelopers(),
    ])

    setProject(projectData)
    setTasks(taskList)
    setMembers(devMembers)
    setAllDevelopers(allDevs)
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const availableDevelopers = allDevelopers.filter(
    (d) => !members.some((m) => m.id === d.id),
  )

  const handleAddDeveloper = async () => {
    if (!selectedDev) return
    await supabase.from('project_members').insert({
      project_id: id,
      user_id: selectedDev,
    })
    setSelectedDev('')
    loadProject()
  }

  const handleRemoveDeveloper = async (userId) => {
    await supabase
      .from('project_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId)
    loadProject()
  }

  const filteredTasks = filterTasksByStatus(tasks, filter)

  const handleDeleteProject = async () => {
    await supabase.from('projects').delete().eq('id', id)
    navigate('/manager/projects')
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
        </div>
      </PageWrapper>
    )
  }

  if (!project) {
    return (
      <PageWrapper>
        <p className="text-white/50">Project not found.</p>
        <Link to="/manager/projects" className="mt-4 text-sm text-blue-400 hover:underline">
          Back to projects
        </Link>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          to="/manager/projects"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="glass-panel p-8">
          <div className="mb-2 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
            {/* Delete button — only visible to project creator */}
            {project.created_by === profile?.id && (
              <button
                onClick={() => setConfirmDeleteProject(true)}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </button>
            )}
          </div>
          {project.description && (
            <p className="mb-6 text-white/50">{project.description}</p>
          )}
          <ProjectProgressBar tasks={tasks} />
        </div>

        <div className="glass-panel p-8">
          <h2 className="mb-6 text-lg font-semibold text-white">Team Members</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {availableDevelopers.length > 0 && (
              <div className="flex flex-1 gap-2">
                <select
                  value={selectedDev}
                  onChange={(e) => setSelectedDev(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                >
                  <option value="">Select developer to add…</option>
                  {availableDevelopers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name || d.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddDeveloper}
                  disabled={!selectedDev}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Add
                </button>
              </div>
            )}
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-white/40">No developers assigned to this project.</p>
          ) : (
            <div className="space-y-2">
              {members.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {dev.avatar_url ? (
                      <img src={dev.avatar_url} alt="" className="h-8 w-8 rounded-full border border-white/10" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                        {(dev.full_name || dev.email)?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white">{dev.full_name || '—'}</p>
                      <p className="text-xs text-white/40">{dev.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDeveloper(dev.id)}
                    className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Tasks</h2>
            <button
              onClick={() => {
                setEditingTask(null)
                setShowTaskModal(true)
              }}
              className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </button>
          </div>

          <div className="mb-6">
            <FilterTabs active={filter} onChange={setFilter} />
          </div>

          {filteredTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No tasks found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Assignee</th>
                    <th className="pb-3 pr-4 font-medium">Priority</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Due Date</th>
                    <th className="pb-3 pr-4 font-medium">Allocated At</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
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
                          {task.assignee?.full_name || 'Unassigned'}
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
                          <button
                            onClick={() => {
                              setEditingTask(task)
                              setShowTaskModal(true)
                            }}
                            className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
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
        open={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setEditingTask(null)
        }}
        onSaved={loadProject}
        projectId={id}
        developers={members}
        task={editingTask}
        userId={profile?.id}
      />

      <ConfirmDialog
        isOpen={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project?.name}"? All tasks will be unlinked. This cannot be undone.`}
        onConfirm={handleDeleteProject}
        onCancel={() => setConfirmDeleteProject(false)}
      />
    </PageWrapper>
  )
}
