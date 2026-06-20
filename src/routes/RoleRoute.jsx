import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ allowedRoles, children }) {
  const { profile, loading, resolveRoute } = useAuth()

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/" replace />
  }

  const destination = resolveRoute(profile)

  if (destination === '/pending') {
    return <Navigate to="/pending" replace />
  }

  if (destination === '/deactivated') {
    return <Navigate to="/deactivated" replace />
  }

  if (!profile.role || !allowedRoles.includes(profile.role)) {
    return <Navigate to={destination} replace />
  }

  return children
}
