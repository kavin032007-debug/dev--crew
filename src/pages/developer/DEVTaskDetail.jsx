import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Send } from 'lucide-react'
import DevPageWrapper from '../../components/layout/DevPageWrapper'
import { useAuth } from '../../context/AuthContext'
import { usePresenceBroadcast } from '../../hooks/useOnlinePresence'
import {
  addTaskResponse,
  fetchTaskById,
  fetchTaskResponses,
  formatTimeAgo,
  updateTaskStatus,
} from '../../services/developerService'
import {
  formatDate,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../../utils/taskUtils'

export default function DEVTaskDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  usePresenceBroadcast(profile)

  const [task, setTask] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const loadTask = useCallback(async () => {
    setLoading(true)
    const [taskData, responseData] = await Promise.all([
      fetchTaskById(id),
      fetchTaskResponses(id),
    ])

    if (taskData && taskData.assignee_id !== profile?.id) {
      setTask(null)
    } else {
      setTask(taskData)
      setResponses(responseData)
    }
    setLoading(false)
  }, [id, profile?.id])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  const handleStatusChange = async (newStatus) => {
    if (!task || newStatus === task.status) return
    setUpdatingStatus(true)
    try {
      await updateTaskStatus(task, newStatus, profile?.full_name || profile?.email || 'Developer')
      await loadTask()
    } catch (err) {
      console.error('Failed to update status:', err.message)
    }
    setUpdatingStatus(false)
  }

  const handleSendResponse = async (e) => {
    e.preventDefault()
    if (!message.trim() || !profile?.id) return
    setSending(true)
    try {
      await addTaskResponse(id, profile.id, message)
      setMessage('')
      const responseData = await fetchTaskResponses(id)
      setResponses(responseData)
    } catch (err) {
      console.error('Failed to send response:', err.message)
    }
    setSending(false)
  }

  if (loading) {
    return (
      <DevPageWrapper>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
        </div>
      </DevPageWrapper>
    )
  }

  if (!task) {
    return (
      <DevPageWrapper>
        <p className="text-white/50">Task not found or not assigned to you.</p>
        <Link to="/developer/tasks" className="mt-4 text-sm text-emerald-400 hover:underline">
          Back to My Tasks
        </Link>
      </DevPageWrapper>
    )
  }

  return (
    <DevPageWrapper>
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          to="/developer/tasks"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Tasks
        </Link>

        <div className="glass-panel p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-2xl font-semibold text-white">{task.title}</h1>
              {task.project?.name && (
                <p className="text-sm text-white/40">{task.project.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs ${PRIORITY_COLORS[task.priority]}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>
          </div>

          {task.description && (
            <p className="mb-6 text-sm leading-relaxed text-white/60">{task.description}</p>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-white/40">Status</p>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className={`rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm capitalize outline-none disabled:opacity-50 ${STATUS_COLORS[task.status]}`}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs text-white/40">Due Date</p>
              <p className="text-sm text-white">{formatDate(task.deadline)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-white/40">Allocated At</p>
              <p className="text-sm text-white">{formatDate(task.allocated_at)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-white/40">Priority</p>
              <p className="text-sm capitalize text-white">{PRIORITY_LABELS[task.priority]}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Activity Log</h2>
          </div>

          {responses.length === 0 ? (
            <p className="mb-6 text-sm text-white/40">No responses yet. Add a log entry below.</p>
          ) : (
            <div className="mb-6 space-y-4">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    {response.user?.avatar_url ? (
                      <img
                        src={response.user.avatar_url}
                        alt=""
                        className="h-7 w-7 rounded-full border border-white/10"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                        {(response.user?.full_name || '?')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {response.user?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-white/40">{formatTimeAgo(response.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-white/70">{response.message}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendResponse} className="flex gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a log entry…"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </DevPageWrapper>
  )
}
