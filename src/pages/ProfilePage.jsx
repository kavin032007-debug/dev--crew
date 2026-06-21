import { useEffect, useRef, useState } from 'react'
import { Camera, Save, Shield, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'

const ROLE_BADGE = {
  super_admin: 'border-violet-500/30 bg-violet-500/15 text-violet-400',
  manager: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
  developer: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
}

const ROLE_ACCENT = {
  super_admin: 'border-violet-500/20 bg-violet-500/10',
  manager: 'border-blue-500/20 bg-blue-500/10',
  developer: 'border-emerald-500/20 bg-emerald-500/10',
}

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) setFullName(profile.full_name || '')
  }, [profile])

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleSaveName = async () => {
    setSaving(true)
    setError('')
    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      await refreshProfile()
      showSuccess('Name updated successfully!')
    }
    setSaving(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const filePath = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const avatarUrl = urlData.publicUrl

    const { error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', profile.id)

    if (dbError) {
      setError(dbError.message)
    } else {
      await refreshProfile()
      showSuccess('Avatar updated!')
    }
    setUploading(false)
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
      </div>
    )
  }

  const badgeClass = ROLE_BADGE[profile.role] || 'border-white/20 bg-white/10 text-white/60'
  const accentClass = ROLE_ACCENT[profile.role] || 'border-white/20 bg-white/10'

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 md:p-10">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accentClass}`}>
            <User className="h-5 w-5 text-white/70" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">My Profile</h1>
            <p className="text-xs text-white/40">Manage your account details</p>
          </div>
        </div>

        {/* Avatar section */}
        <div className="glass-panel p-8">
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full border-2 border-white/10 object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/10 bg-white/5 text-3xl font-semibold text-white/50 shadow-xl">
                  {(profile.full_name || profile.email)?.[0]?.toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white disabled:opacity-50"
                title="Change avatar"
              >
                {uploading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white/30 border-t-white" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${badgeClass}`}>
              <Shield className="mr-1.5 inline h-3 w-3" />
              {profile.role?.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-4">
            {/* Full name */}
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500/50 focus:bg-white/[0.07]"
              />
            </div>

            {/* Email — read-only */}
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Email</label>
              <input
                value={profile.email || ''}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white/40 outline-none"
              />
            </div>

            {/* Role — read-only */}
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Role</label>
              <input
                value={profile.role?.replace('_', ' ') || 'Pending'}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm capitalize text-white/40 outline-none"
              />
            </div>

            {/* Feedback */}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {successMsg && (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                {successMsg}
              </p>
            )}

            {/* Save button */}
            <button
              onClick={handleSaveName}
              disabled={saving || !fullName.trim() || fullName.trim() === profile.full_name}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-50"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border border-blue-400/30 border-t-blue-400" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
