import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, Trash2 } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import ProjectProgressBar from '../../components/ProjectProgressBar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import { usePresenceBroadcast } from '../../hooks/useOnlinePresence'
import {
  fetchManagerProjects,
  fetchProjectTasks,
} from '../../services/managerService'
import { supabase } from '../../services/supabase'
import { formatDate } from '../../utils/taskUtils'

function CreateProjectModal({ open, onClose, onCreated, userId }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setError(null)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name: name.trim(), description: description.trim() || null, created_by: userId })
      .select()
      .single()

    if (projectError) {
      setError(projectError.message)
      setSaving(false)
      return
    }

    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
    })

    onCreated()
    onClose()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6">
        <h2 className="mb-6 text-lg font-semibold text-white">Create Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
              placeholder="Project name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
              placeholder="Optional description"
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
              className="flex-1 rounded-xl bg-blue-500/20 px-4 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/30 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MGRProjects() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  usePresenceBroadcast(profile)

  const [projects, setProjects] = useState([])
  const [tasksMap, setTasksMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(null) // project object

  const loadProjects = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)

    const projectList = await fetchManagerProjects(profile.id)
    const taskEntries = await Promise.all(
      projectList.map(async (p) => [p.id, await fetchProjectTasks(p.id)]),
    )
    const map = Object.fromEntries(taskEntries)

    setProjects(projectList)
    setTasksMap(map)
    setLoading(false)
  }, [profile?.id])

  const handleDeleteProject = async () => {
    if (!confirmDeleteProject) return
    await supabase.from('projects').delete().eq('id', confirmDeleteProject.id)
    setConfirmDeleteProject(null)
    loadProjects()
  }

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Projects</h1>
            <p className="text-sm text-white/50">Manage your projects and teams</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel py-16 text-center">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <p className="text-white/40">No projects yet. Create your first project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="glass-panel glass-panel-hover relative p-6">
                {/* Delete button — only visible to the project creator */}
                {project.created_by === profile?.id && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setConfirmDeleteProject(project)
                    }}
                    className="absolute right-4 top-4 rounded-lg border border-red-500/20 p-1.5 text-red-400/60 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 [.glass-panel-hover:hover_&]:opacity-100"
                    title="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <Link to={`/manager/projects/${project.id}`} className="block">
                  <h3 className="mb-1 text-lg font-semibold text-white">{project.name}</h3>
                  {project.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-white/50">{project.description}</p>
                  )}
                  <p className="mb-4 text-xs text-white/30">Created {formatDate(project.created_at)}</p>
                  <ProjectProgressBar tasks={tasksMap[project.id] || []} size="mini" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadProjects}
        userId={profile?.id}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteProject)}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmDeleteProject?.name}"? All tasks will be unlinked. This cannot be undone.`}
        onConfirm={handleDeleteProject}
        onCancel={() => setConfirmDeleteProject(null)}
      />
    </PageWrapper>
  )
}
