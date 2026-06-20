import { Clock } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PendingPage() {
  const { profile, loading, resolveRoute, signOut, cancelAndSignOut } = useAuth()

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
      </div>
    )
  }

  if (profile && resolveRoute(profile) !== '/pending') {
    return <Navigate to={resolveRoute(profile)} replace />
  }

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
          <Clock className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-white">Your request is under review</h1>
        <p className="mb-6 text-white/50">
          Requested role:{' '}
          <span className="font-medium capitalize text-white/80">
            {profile?.pending_role?.replace('_', ' ') || '—'}
          </span>
        </p>
        <p className="mb-8 text-sm text-white/40">
          A Super Admin will review your request shortly. You'll be notified once approved.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={signOut}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15"
          >
            Logout
          </button>
          <button
            onClick={cancelAndSignOut}
            className="w-full rounded-xl border border-white/5 px-4 py-3 text-sm font-medium text-white/50 transition-all hover:border-white/10 hover:text-white/70"
          >
            Cancel / Wrong account?
          </button>
        </div>
      </div>
    </div>
  )
}
