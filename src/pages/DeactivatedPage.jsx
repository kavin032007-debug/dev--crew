import { Ban } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DeactivatedPage() {
  const { profile, loading, resolveRoute, signOut } = useAuth()

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
      </div>
    )
  }

  if (profile && resolveRoute(profile) !== '/deactivated') {
    return <Navigate to={resolveRoute(profile)} replace />
  }

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
          <Ban className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-white">Account Deactivated</h1>
        <p className="mb-2 text-white/50">
          Your <span className="capitalize text-white/70">{profile?.role?.replace('_', ' ')}</span>{' '}
          account has been deactivated.
        </p>
        <p className="mb-8 text-sm text-white/40">
          Please contact your Super Admin if you believe this is an error.
        </p>
        <button
          onClick={signOut}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
