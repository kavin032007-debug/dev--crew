export function calculateProjectProgress(tasks) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
  return { completedTasks, totalTasks, progress }
}
