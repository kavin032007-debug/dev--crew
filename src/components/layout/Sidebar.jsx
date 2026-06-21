import { NavLink } from 'react-router-dom'
import { CheckSquare, FolderKanban, LayoutDashboard, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const MANAGER_LINKS = [
  { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/manager/my-tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/manager/projects', label: 'Projects', icon: FolderKanban },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/5 bg-white/[0.02] p-6">
      <div className="mb-8">
        <h1 className="text-lg font-bold text-white">DevCrew</h1>
        <p className="text-xs capitalize text-white/40">{profile?.role?.replace('_', ' ')}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {MANAGER_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 pt-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full border border-white/10" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
              {(profile?.full_name || profile?.email)?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">{profile?.full_name || 'User'}</p>
            <p className="truncate text-xs text-white/40">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 transition-all hover:bg-white/5 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
