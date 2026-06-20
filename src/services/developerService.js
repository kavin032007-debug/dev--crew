import { supabase } from './supabase'

export async function fetchDeveloperTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name)')
    .eq('assignee_id', userId)
    .order('deadline', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Failed to fetch developer tasks:', error.message)
    return []
  }
  return data || []
}

export async function fetchDeveloperProjectCount(userId) {
  const { count, error } = await supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) return 0
  return count ?? 0
}

export async function fetchTaskById(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name)')
    .eq('id', taskId)
    .single()

  if (error) {
    console.error('Failed to fetch task:', error.message)
    return null
  }
  return data
}

export async function fetchTaskResponses(taskId) {
  const { data, error } = await supabase
    .from('task_responses')
    .select('*, user:users(id, full_name, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch task responses:', error.message)
    return []
  }
  return data || []
}

export function getDueSoonTasks(tasks) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const threeDaysLater = new Date(today)
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)

  return tasks.filter((task) => {
    if (task.status === 'completed' || !task.deadline) return false
    const due = new Date(task.deadline)
    due.setHours(0, 0, 0, 0)
    return due <= threeDaysLater
  })
}

export function getActiveTasks(tasks) {
  return tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export function sortTasks(tasks, sortBy) {
  const sorted = [...tasks]
  if (sortBy === 'deadline') {
    sorted.sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline) - new Date(b.deadline)
    })
  } else if (sortBy === 'priority') {
    sorted.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }
  return sorted
}

export async function updateTaskStatus(task, newStatus, assigneeName) {
  const { error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', task.id)

  if (error) throw error

  if (task.created_by) {
    await supabase.from('notifications').insert({
      user_id: task.created_by,
      title: 'Task status updated',
      message: `${assigneeName} updated "${task.title}" to ${newStatus.replace('_', ' ')}`,
      type: 'status_update',
      related_task_id: task.id,
    })
  }
}

export async function addTaskResponse(taskId, userId, message) {
  const { error } = await supabase.from('task_responses').insert({
    task_id: taskId,
    user_id: userId,
    message: message.trim(),
  })

  if (error) throw error
}

export function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
