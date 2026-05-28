import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderKanban, AlertCircle, X, ChevronDown } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'

// ─── Helper functions ─────────────────────────────────────────────────────────

const getStatusStyle = (status) => {
  if (status === 'active') return { backgroundColor: '#ede9fe', color: '#5e6ad2' }
  return { backgroundColor: '#f9fafb', color: '#9ca3af' }
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
// Shown while data is loading — matches the real ProjectRow height

function SkeletonRow({ isLast }) {
  return (
    <div
      className="px-6 py-4"
      style={{ borderBottom: isLast ? 'none' : '1px solid #e5e7eb' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-2" />
    </div>
  )
}

// ─── ProjectRow ───────────────────────────────────────────────────────────────

function ProjectRow({ project, isLast, showLink }) {
  const statusStyle = getStatusStyle(project.status)

  return (
    <div
      className={`px-6 py-4 transition-colors ${showLink ? 'hover:bg-gray-50' : ''}`}
      style={{ borderBottom: isLast ? 'none' : '1px solid #e5e7eb' }}
    >
      <div className="flex items-start justify-between mb-2">
        {/* Left: name + badge + team name */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold" style={{ fontSize: '15px', color: '#111827' }}>
              {project.name}
            </h3>
            <span
              className="px-2 py-0.5 rounded-full capitalize"
              style={{ ...statusStyle, fontSize: '12px' }}
              role="status"
              aria-label={`Project status: ${project.status}`}
            >
              {project.status}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            {project.teamName}
          </p>
        </div>

        {/* Right: open link — only on active projects */}
        {showLink && (
          <Link
            to={`/app/teams/${project.teamId}/projects/${project.id}/board`}
            style={{ fontSize: '13px', color: '#5e6ad2', fontWeight: 500, whiteSpace: 'nowrap' }}
            className="transition-opacity hover:opacity-70"
            aria-label={`Open ${project.name} project board`}
          >
            Open →
          </Link>
        )}
      </div>

      {/* Meta: tasks · sprints */}
      <div className="flex items-center gap-4" style={{ fontSize: '12px', color: '#9ca3af' }}>
        <span>{project._count?.tasks ?? 0} tasks</span>
        <span>·</span>
        <span>{project._count?.sprints ?? 0} sprints</span>
      </div>
    </div>
  )
}

// ─── CreateProjectModal ───────────────────────────────────────────────────────
// WHY teamId selector: this modal is opened from the Projects page where there's
// no team context. The user must pick which team to create the project under.
// When reused from TeamDetailPage, teamId will be pre-set and the selector hidden.

function CreateProjectModal({ isOpen, onClose, teams, onProjectCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
      setSelectedTeamId(teams[0]?.id ?? '')
      setError('')
    }
  }, [isOpen, teams])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    setError('')
    if (!name.trim()) {
      setError('Project name is required.')
      return
    }
    if (!selectedTeamId) {
      setError('Please select a team.')
      return
    }

    setIsSubmitting(true)
    try {
      // POST /api/projects → { success: true, data: { ...project } }
      const res = await api.post('/projects', {
        name: name.trim(),
        description: description.trim() || null,
        teamId: selectedTeamId,
      })
      onProjectCreated(res.data.data, selectedTeamId)
      onClose()
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Project name is required.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal container */}
      <div
        className="bg-white rounded-lg w-full"
        style={{ maxWidth: '480px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <h2
            id="create-project-title"
            className="font-bold"
            style={{ fontSize: '18px', color: '#111827' }}
          >
            Create Project
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded transition-colors hover:bg-gray-100"
          >
            <X size={20} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Team selector */}
          <div>
            <label
              htmlFor="project-team"
              className="block mb-1.5 font-medium"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Team
            </label>
            <div className="relative">
              <select
                id="project-team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none appearance-none"
                style={{ fontSize: '14px', height: '36px', color: '#111827' }}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#9ca3af' }}
              />
            </div>
          </div>

          {/* Project name */}
          <div>
            <label
              htmlFor="project-name"
              className="block mb-1.5 font-medium"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Project Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Redesign"
              aria-required="true"
              className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none transition-colors"
              style={{ fontSize: '14px', height: '36px', color: '#111827' }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="project-description"
              className="block mb-1.5 font-medium"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Description
              <span className="ml-1 font-normal" style={{ color: '#9ca3af', fontSize: '13px' }}>
                (optional)
              </span>
            </label>
            <textarea
              id="project-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none transition-colors resize-none"
              style={{ fontSize: '14px', color: '#111827' }}
            />
          </div>

          {/* Inline error */}
          {error && (
            <p style={{ fontSize: '13px', color: '#dc2626' }} role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #e5e7eb' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md font-medium transition-colors hover:bg-gray-50"
            style={{ fontSize: '14px', color: '#6b7280' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            aria-busy={isSubmitting}
            className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#5e6ad2',
              color: 'white',
              fontSize: '14px',
              opacity: isSubmitting || !name.trim() ? 0.6 : 1,
              cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // ── Data fetching ─────────────────────────────────────────────────────────────
  // WHY this strategy: GET /api/projects requires a teamId query param — there is
  // no "fetch all projects" endpoint. So we:
  //   1. Fetch all teams the user belongs to
  //   2. For each team that has projects (_count.projects > 0), fetch its projects
  //   3. Flatten and attach teamName to each project for display
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: get all teams — response shape: { teams: [...] }
      const teamsRes = await api.get('/teams')
      const teamsData = teamsRes.data.teams ?? []
      setTeams(teamsData)

      // Step 2: fetch projects only for teams that have them
      const teamsWithProjects = teamsData.filter((t) => t._count?.projects > 0)

      if (teamsWithProjects.length === 0) {
        setProjects([])
        return
      }

      // Parallel fetch — one call per team
      const projectResponses = await Promise.all(
        teamsWithProjects.map((team) =>
          api.get(`/projects?teamId=${team.id}`).then((res) => ({
            teamId: team.id,
            teamName: team.name,
            // GET /api/projects → { success: true, data: [...] }
            projects: res.data.data ?? [],
          }))
        )
      )

      // Step 3: flatten and attach teamName to each project
      const allProjects = projectResponses.flatMap(({ teamId, teamName, projects }) =>
        projects.map((p) => ({ ...p, teamId, teamName }))
      )

      setProjects(allProjects)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      } else {
        setError('failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ── Derived state ─────────────────────────────────────────────────────────────
  // WHY derived not useState: active/archived split recalculates automatically
  // whenever projects changes — no extra setState needed.
  const activeProjects = projects.filter((p) => p.status === 'active')
  const archivedProjects = projects.filter((p) => p.status === 'archived')

  // ── Handle new project created ────────────────────────────────────────────────
  // Prepend the new project to the list with the correct teamName attached.
  const handleProjectCreated = (newProject, teamId) => {
    const team = teams.find((t) => t.id === teamId)
    setProjects((prev) => [
      { ...newProject, teamId, teamName: team?.name ?? '' },
      ...prev,
    ])
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Projects" />
        <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
          </div>
          <div
            className="bg-white border rounded-md overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            {[1, 2, 3].map((i) => (
              <SkeletonRow key={i} isLast={i === 3} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error === 'failed') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Projects" />
        <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>
          <div
            className="flex items-center gap-3 p-4 rounded-md"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <AlertCircle size={16} style={{ color: '#dc2626' }} />
            <span style={{ fontSize: '14px', color: '#dc2626' }}>
              Failed to load projects. Please refresh the page.
            </span>
            <button
              onClick={fetchData}
              className="ml-auto font-medium transition-opacity hover:opacity-70"
              style={{ fontSize: '14px', color: '#5e6ad2' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Projects" />

      <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>

        {/* ── Empty state — no projects at all ───────────────────────────────── */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FolderKanban size={40} className="mb-4" style={{ color: '#e5e7eb' }} />
            <h3 className="font-bold mb-1" style={{ fontSize: '16px', color: '#111827' }}>
              No projects yet
            </h3>
            <p className="mb-6" style={{ fontSize: '14px', color: '#9ca3af' }}>
              Create your first project to start tracking work
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
            >
              + Create Project
            </button>
          </div>
        ) : (
          <>
            {/* ── Active projects section ───────────────────────────────────── */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold" style={{ fontSize: '16px', color: '#111827' }}>
                  Active Projects
                  <span
                    className="ml-2 font-normal"
                    style={{ fontSize: '13px', color: '#9ca3af' }}
                  >
                    ({activeProjects.length})
                  </span>
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '13px' }}
                >
                  + Create Project
                </button>
              </div>

              {activeProjects.length === 0 ? (
                <div
                  className="bg-white border rounded-md px-6 py-10 flex flex-col items-center text-center"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>No active projects</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 font-medium transition-opacity hover:opacity-70"
                    style={{ fontSize: '13px', color: '#5e6ad2' }}
                  >
                    + Create Project
                  </button>
                </div>
              ) : (
                <div
                  className="bg-white border rounded-md overflow-hidden"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  {activeProjects.map((project, index) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      isLast={index === activeProjects.length - 1}
                      showLink={true}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Archived projects section — only shown if any exist ───────── */}
            {archivedProjects.length > 0 && (
              <div>
                <h2 className="font-bold mb-4" style={{ fontSize: '16px', color: '#111827' }}>
                  Archived Projects
                  <span
                    className="ml-2 font-normal"
                    style={{ fontSize: '13px', color: '#9ca3af' }}
                  >
                    ({archivedProjects.length})
                  </span>
                </h2>
                <div
                  className="bg-white border rounded-md overflow-hidden"
                  style={{ borderColor: '#e5e7eb', opacity: 0.6 }}
                >
                  {archivedProjects.map((project, index) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      isLast={index === archivedProjects.length - 1}
                      showLink={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create Project modal ──────────────────────────────────────────────── */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        teams={teams}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}