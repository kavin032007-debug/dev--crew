import {
  CheckSquare,
  MessageSquare,
  RefreshCw,
  UserCheck,
  UserX,
} from 'lucide-react'
import { supabase } from './supabase'

export const NOTIFICATION_ICONS = {
  task_assigned: { icon: CheckSquare, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  status_update: { icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  request_approved: { icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  request_rejected: { icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  task_comment: { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
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

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch notifications:', error.message)
    return []
  }
  return data || []
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

export async function getTaskNavigationPath(relatedTaskId, role) {
  if (!relatedTaskId) return null

  if (role === 'developer') {
    return `/developer/tasks/${relatedTaskId}`
  }

  if (role === 'super_admin') {
    return '/super-admin/tasks'
  }

  if (role === 'manager') {
    const { data } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', relatedTaskId)
      .single()

    if (data?.project_id) return `/manager/projects/${data.project_id}`
    return '/manager/dashboard'
  }

  return null
}
