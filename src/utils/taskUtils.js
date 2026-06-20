export function getDeadlineStatus(deadline, status) {
  if (status === 'completed') return 'normal'
  if (!deadline) return 'normal'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)
  const diff = (due - today) / (1000 * 60 * 60 * 24)

  if (diff < 0) return 'overdue'
  if (diff === 0) return 'due_today'
  if (diff <= 3) return 'due_soon'
  return 'normal'
}

export function getDeadlineRowClass(status) {
  switch (status) {
    case 'overdue':
      return 'bg-red-500/10 border-l-2 border-l-red-500'
    case 'due_today':
      return 'bg-amber-500/10 border-l-2 border-l-amber-500'
    case 'due_soon':
      return 'border-l-2 border-l-amber-500/50'
    default:
      return ''
  }
}

export function getDeadlineBadge(status) {
  switch (status) {
    case 'overdue':
      return { label: 'Overdue', className: 'bg-red-500/20 text-red-300' }
    case 'due_today':
      return { label: 'Due Today', className: 'bg-amber-500/20 text-amber-300' }
    default:
      return null
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const PRIORITY_COLORS = {
  low: 'bg-slate-500/20 text-slate-300',
  medium: 'bg-blue-500/20 text-blue-300',
  high: 'bg-red-500/20 text-red-300',
}

export const STATUS_COLORS = {
  pending: 'bg-amber-500/20 text-amber-300',
  in_progress: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-emerald-500/20 text-emerald-300',
}

export const TASK_FILTERS = ['all', 'pending', 'in_progress', 'completed']

export function filterTasksByStatus(tasks, filter) {
  if (filter === 'all') return tasks
  return tasks.filter((t) => t.status === filter)
}
