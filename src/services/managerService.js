import { supabase } from './supabase'

export async function fetchManagerProjectIds(userId) {
  const [{ data: created }, { data: memberships }] = await Promise.all([
    supabase.from('projects').select('id').eq('created_by', userId),
    supabase.from('project_members').select('project_id').eq('user_id', userId),
  ])

  const ids = new Set([
    ...(created || []).map((p) => p.id),
    ...(memberships || []).map((m) => m.project_id),
  ])
  return [...ids]
}

export async function fetchManagerProjects(userId) {
  const projectIds = await fetchManagerProjectIds(userId)
  if (projectIds.length === 0) return []

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('id', projectIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch projects:', error.message)
    return []
  }
  return data || []
}

export async function fetchProjectTasks(projectId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:users!tasks_assignee_id_fkey(id, full_name, email)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return []
  }
  return data || []
}

export async function fetchManagerTasks(userId) {
  const projectIds = await fetchManagerProjectIds(userId)
  if (projectIds.length === 0) return []

  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:users!tasks_assignee_id_fkey(full_name), project:projects(name)')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch manager tasks:', error.message)
    return []
  }
  return data || []
}

export async function fetchProjectDevelopers(projectId) {
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)

  if (membersError || !members?.length) return []

  const userIds = members.map((m) => m.user_id)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds)
    .eq('role', 'developer')
    .eq('is_active', true)
    .order('full_name')

  if (usersError) return []
  return users || []
}

export async function fetchActiveDevelopers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'developer')
    .eq('is_active', true)
    .order('full_name')

  if (error) return []
  return data || []
}

export async function notifyTaskAssigned(assigneeId, taskTitle, taskId) {
  if (!assigneeId) return
  await supabase.from('notifications').insert({
    user_id: assigneeId,
    title: 'New task assigned',
    message: `You have been assigned: ${taskTitle}`,
    type: 'task_assigned',
    related_task_id: taskId,
  })
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}
