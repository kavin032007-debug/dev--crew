import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { leavePresence } from '../hooks/useOnlinePresence'
import { ROLE_DASHBOARDS, SELECTED_ROLE_KEY, supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch profile:', error.message)
      return null
    }
    return data
  }, [])

  const resolveRoute = useCallback((userProfile) => {
    if (!userProfile) return '/'
    const { role, is_active } = userProfile
    if (role && !is_active) return '/deactivated'
    if (!role && !is_active) return '/pending'
    if (role && is_active && ROLE_DASHBOARDS[role]) {
      return ROLE_DASHBOARDS[role]
    }
    return '/'
  }, [])

  const handlePostSignIn = useCallback(
    async (userId, userMeta) => {
      let userProfile = await fetchProfile(userId)

      // If no row exists, create it manually
      if (!userProfile) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userMeta?.email,
            full_name: userMeta?.user_metadata?.full_name,
            avatar_url: userMeta?.user_metadata?.avatar_url,
            is_active: false,
          })
          .select()
          .single()

        if (insertError) {
          console.error('Failed to create user row:', insertError.message)
          // Try fetching again in case of race condition
          await new Promise((r) => setTimeout(r, 1000))
          userProfile = await fetchProfile(userId)
        } else {
          userProfile = newUser
        }
      }

      if (!userProfile) return null

      const selectedRole = localStorage.getItem(SELECTED_ROLE_KEY)

      if (
        !userProfile.role &&
        !userProfile.is_active &&
        selectedRole &&
        (selectedRole === 'manager' || selectedRole === 'developer') &&
        !userProfile.pending_role
      ) {
        const { data: updated, error } = await supabase
          .from('users')
          .update({ pending_role: selectedRole })
          .eq('id', userId)
          .select()
          .single()

        if (!error && updated) {
          userProfile = updated
        }
      }

      setProfile(userProfile)
      localStorage.removeItem(SELECTED_ROLE_KEY)

      const route = resolveRoute(userProfile)
      navigate(route, { replace: true })

      return userProfile
    },
    [fetchProfile, navigate, resolveRoute],
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).then((p) => {
          setProfile(p)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)

      if (event === 'SIGNED_IN' && newSession?.user) {
        setLoading(true)
        await handlePostSignIn(newSession.user.id, newSession.user)
        setLoading(false)
      }

      if (event === 'SIGNED_OUT') {
        await leavePresence()
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, handlePostSignIn])

  const signInWithGoogle = async (selectedRole) => {
    localStorage.setItem(SELECTED_ROLE_KEY, selectedRole)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://dev-crew-flame.vercel.app',
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await leavePresence()
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    navigate('/', { replace: true })
  }

  const cancelAndSignOut = async () => {
    localStorage.removeItem(SELECTED_ROLE_KEY)
    await signOut()
  }

  const refreshProfile = async () => {
    if (!session?.user) return null
    const userProfile = await fetchProfile(session.user.id)
    setProfile(userProfile)
    return userProfile
  }

  const value = {
    session,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    cancelAndSignOut,
    refreshProfile,
    resolveRoute,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}