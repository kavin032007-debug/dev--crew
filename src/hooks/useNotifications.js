import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const data = await fetchNotifications(userId)
    setNotifications(data)
    setUnreadCount(data.filter((n) => !n.is_read).length)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          setUnreadCount((prev) => prev + 1)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => {
            const next = prev.map((n) => (n.id === payload.new.id ? payload.new : n))
            setUnreadCount(next.filter((n) => !n.is_read).length)
            return next
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markRead = async (notificationId) => {
    await markNotificationRead(notificationId)
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      setUnreadCount(next.filter((n) => !n.is_read).length)
      return next
    })
  }

  const markAllRead = async () => {
    if (!userId) return
    await markAllNotificationsRead(userId)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: loadNotifications,
  }
}
