import { supabase } from './supabase'
import { notifyTaskAssigned, todayISO } from './managerService'

export { todayISO }

export async function fetchAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assignee_id_fkey(id, full_name, email, role),
      project:projects(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return []
  }
  return data || []
}

export async function fetchAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .order('name')

  if (error) return []
  return data || []
}

export async function fetchActiveManagersAndDevelopers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('role', ['manager', 'developer'])
    .eq('is_active', true)
    .order('full_name')

  if (error) return []
  return data || []
}

export async function createTask(taskData, userId) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: taskData.title,
      description: taskData.description || null,
      project_id: taskData.project_id || null,
      assignee_id: taskData.assignee_id || null,
      created_by: userId,
      deadline: taskData.deadline,
      priority: taskData.priority,
      allocated_at: todayISO(),
    })
    .select()
    .single()

  if (error) throw error

  if (taskData.assignee_id) {
    await notifyTaskAssigned(taskData.assignee_id, taskData.title, data.id)
  }

  return data
}

export async function updateTask(taskId, taskData) {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: taskData.title,
      description: taskData.description || null,
      project_id: taskData.project_id || null,
      assignee_id: taskData.assignee_id || null,
      deadline: taskData.deadline,
      priority: taskData.priority,
    })
    .eq('id', taskId)

  if (error) throw error
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

export async function fetchUsersByRole(role) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch users:', error.message)
    return []
  }
  return data || []
}

export async function preRegisterUser(email, fullName, role) {
  const { error } = await supabase.from('users').insert({
    id: crypto.randomUUID(),
    email,
    full_name: fullName,
    role,
    is_active: true,
  })

  if (error) throw error
}

export async function updateUserName(userId, fullName) {
  const { error } = await supabase
    .from('users')
    .update({ full_name: fullName })
    .eq('id', userId)

  if (error) throw error
}

export async function toggleUserActive(userId, isActive) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) throw error
}
