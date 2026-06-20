import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { session, profile, loading, resolveRoute } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  if (profile) {
    const destination = resolveRoute(profile)
    const isPendingRoute = location.pathname === '/pending'
    const isDeactivatedRoute = location.pathname === '/deactivated'

    if (destination === '/pending' && !isPendingRoute) {
      return <Navigate to="/pending" replace />
    }

    if (destination === '/deactivated' && !isDeactivatedRoute) {
      return <Navigate to="/deactivated" replace />
    }

    if (
      destination !== '/pending' &&
      destination !== '/deactivated' &&
      destination !== '/' &&
      (isPendingRoute || isDeactivatedRoute)
    ) {
      return <Navigate to={destination} replace />
    }
  }

  return <Outlet />
}
