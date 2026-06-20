import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  formatTimeAgo,
  getTaskNavigationPath,
  NOTIFICATION_ICONS,
} from '../../services/notificationService'

export default function NotificationDropdown({
  notifications,
  loading,
  onMarkRead,
  onMarkAllRead,
  onClose,
}) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleClick = async (notification) => {
    if (!notification.is_read) {
      await onMarkRead(notification.id)
    }

    if (notification.related_task_id) {
      const path = await getTaskNavigationPath(notification.related_task_id, profile?.role)
      if (path) {
        navigate(path)
        onClose()
      }
    }
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]/95 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/40">You&apos;re all caught up</p>
        ) : (
          notifications.map((notification) => {
            const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.task_assigned
            const Icon = config.icon

            return (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                className={`flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left transition-all hover:bg-white/[0.04] ${
                  !notification.is_read ? 'bg-violet-500/[0.06]' : ''
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.bg}`}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{notification.title}</p>
                    <span className="shrink-0 text-xs text-white/30">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/50">{notification.message}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
