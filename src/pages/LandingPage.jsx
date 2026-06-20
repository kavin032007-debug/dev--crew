import { useState } from 'react'
import { Shield, Users, Code2, Sparkles } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    icon: Shield,
    description: 'Full platform control. Manage users, projects, and tasks across the entire organization.',
    accent: 'from-violet-500/20 to-purple-600/10',
    iconColor: 'text-violet-400',
    borderHover: 'hover:border-violet-500/30',
  },
  {
    id: 'manager',
    name: 'Manager',
    icon: Users,
    description: 'Lead projects and teams. Create projects, assign tasks, and track progress in real time.',
    accent: 'from-blue-500/20 to-cyan-600/10',
    iconColor: 'text-blue-400',
    borderHover: 'hover:border-blue-500/30',
  },
  {
    id: 'developer',
    name: 'Developer',
    icon: Code2,
    description: 'Ship great work. View assigned tasks, update status, and collaborate with your team.',
    accent: 'from-emerald-500/20 to-teal-600/10',
    iconColor: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/30',
  },
]

export default function LandingPage() {
  const { session, profile, loading, signInWithGoogle, resolveRoute } = useAuth()
  const [signingIn, setSigningIn] = useState(null)
  const [error, setError] = useState(null)

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
      </div>
    )
  }

  if (session && profile) {
    return <Navigate to={resolveRoute(profile)} replace />
  }

  const handleSignIn = async (roleId) => {
    setSigningIn(roleId)
    setError(null)
    try {
      await signInWithGoogle(roleId)
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.')
      setSigningIn(null)
    }
  }

  return (
    <div className="gradient-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-16">
        <header className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Agile Project Management
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              DevCrew
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Streamline your development workflow. Choose your role to get started with Google sign-in.
          </p>
        </header>

        {error && (
          <div className="mx-auto mb-8 max-w-lg rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {ROLES.map((role) => {
            const Icon = role.icon
            const isLoading = signingIn === role.id

            return (
              <div
                key={role.id}
                className={`glass-panel glass-panel-hover group relative flex flex-col overflow-hidden p-8 ${role.borderHover}`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${role.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="relative flex flex-1 flex-col">
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${role.iconColor}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h2 className="mb-3 text-2xl font-semibold text-white">{role.name}</h2>
                  <p className="mb-8 flex-1 text-sm leading-relaxed text-white/50">
                    {role.description}
                  </p>
                  <button
                    onClick={() => handleSignIn(role.id)}
                    disabled={signingIn !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <footer className="mt-16 text-center text-sm text-white/30">
          DevCrew &mdash; Built for agile teams
        </footer>
      </div>
    </div>
  )
}
