import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const PRESENCE_CHANNEL = 'online-presence'

let activeBroadcastChannel = null

function countByRole(presenceState) {
  let managers = 0
  let developers = 0

  Object.values(presenceState).forEach((presences) => {
    const payload = presences[0]
    if (!payload) return
    if (payload.role === 'manager') managers += 1
    if (payload.role === 'developer') developers += 1
  })

  return { managers, developers }
}

export function usePresenceBroadcast(profile) {
  useEffect(() => {
    if (!profile?.id || !['manager', 'developer'].includes(profile.role)) return

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: profile.id } },
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: profile.id,
          role: profile.role,
          name: profile.full_name,
          avatar: profile.avatar_url,
        })
      }
    })

    activeBroadcastChannel = channel

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
      if (activeBroadcastChannel === channel) {
        activeBroadcastChannel = null
      }
    }
  }, [profile?.id, profile?.role, profile?.full_name, profile?.avatar_url])
}

export function usePresenceSubscribe() {
  const [counts, setCounts] = useState({ managers: 0, developers: 0 })

  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL)

    channel
      .on('presence', { event: 'sync' }, () => {
        setCounts(countByRole(channel.presenceState()))
      })
      .on('presence', { event: 'join' }, () => {
        setCounts(countByRole(channel.presenceState()))
      })
      .on('presence', { event: 'leave' }, () => {
        setCounts(countByRole(channel.presenceState()))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return counts
}

export async function leavePresence() {
  if (activeBroadcastChannel) {
    await activeBroadcastChannel.untrack()
    supabase.removeChannel(activeBroadcastChannel)
    activeBroadcastChannel = null
  }
}
