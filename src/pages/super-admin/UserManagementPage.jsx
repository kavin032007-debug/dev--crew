import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, UserCheck, UserX } from 'lucide-react'
import SAPageWrapper from '../../components/layout/SAPageWrapper'
import {
  fetchUsersByRole,
  preRegisterUser,
  toggleUserActive,
  updateUserName,
} from '../../services/superAdminService'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function AddUserModal({ open, onClose, onAdded, role }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setFullName('')
      setEmail('')
      setError(null)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return
    setSaving(true)
    setError(null)
    try {
      await preRegisterUser(email.trim(), fullName.trim(), role)
      onAdded()
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">
          Add {role === 'manager' ? 'Manager' : 'Developer'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Full Name *</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
              placeholder="jane@company.com"
            />
          </div>
          <p className="text-xs text-white/40">
            Pre-registers the user. They skip the pending flow and go straight to their dashboard
            on first Google sign-in.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-violet-500/20 px-4 py-2.5 text-sm font-medium text-violet-400 hover:bg-violet-500/30 disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditNameModal({ open, onClose, onSaved, user }) {
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name || '')
      setError(null)
    }
  }, [open, user])

  if (!open || !user) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await updateUserName(user.id, fullName.trim())
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Edit Name</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Full Name *</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-violet-500/20 px-4 py-2.5 text-sm font-medium text-violet-400 hover:bg-violet-500/30 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UserManagementPage({ role, title }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [actionId, setActionId] = useState(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const data = await fetchUsersByRole(role)
    setUsers(data)
    setLoading(false)
  }, [role])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    )
  }, [users, search])

  const handleToggleActive = async (user) => {
    setActionId(user.id)
    try {
      await toggleUserActive(user.id, !user.is_active)
      await loadUsers()
    } catch (err) {
      console.error('Failed to toggle user status:', err.message)
    }
    setActionId(null)
  }

  return (
    <SAPageWrapper>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-white/50">
              Manage {role === 'manager' ? 'managers' : 'developers'}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-400 hover:bg-violet-500/20"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        <div className="glass-panel p-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">
              {search ? 'No users match your search' : 'No users yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Joined At</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 last:border-0">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full border border-white/10"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/50">
                              {(user.full_name || user.email)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-white">{user.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-white/60">{user.email}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.is_active
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-white/50">{formatDate(user.created_at)}</td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={actionId === user.id}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all disabled:opacity-50 ${
                              user.is_active
                                ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                                : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddUserModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={loadUsers}
        role={role}
      />

      <EditNameModal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSaved={loadUsers}
        user={editingUser}
      />
    </SAPageWrapper>
  )
}
