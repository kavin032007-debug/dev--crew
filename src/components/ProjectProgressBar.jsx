import { calculateProjectProgress } from '../utils/projectProgress'

export default function ProjectProgressBar({ tasks, size = 'default' }) {
  const { completedTasks, totalTasks, progress } = calculateProjectProgress(tasks)

  if (totalTasks > 0 && progress === 100) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
        Project Complete
      </span>
    )
  }

  const barHeight = size === 'mini' ? 'h-1.5' : 'h-2'

  return (
    <div className={size === 'mini' ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>
          {completedTasks} of {totalTasks} tasks completed
        </span>
        <span>{progress}%</span>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-white/10 ${barHeight}`}>
        <div
          className={`${barHeight} rounded-full bg-emerald-500 transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
