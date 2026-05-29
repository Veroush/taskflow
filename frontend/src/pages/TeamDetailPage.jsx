import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Edit2, AlertCircle, Users, FolderKanban } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'
import CreateProjectModal from '../components/CreateProjectModal'

// ─── Helper functions ─────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getStatusStyle = (status) => {
  if (status === 'active') {
    return { backgroundColor: '#ede9fe', color: '#5e6ad2' }
  }
  return { backgroundColor: '#f9fafb', color: '#9ca3af' }
}

// CreateProjectModal is a real shared component — imported at the top of this file.

// ─── ProjectRow ───────────────────────────────────────────────────────────────

function ProjectRow({ project, teamId, isLast }) {
  const statusStyle = getStatusStyle(project.status)

  return (
    <div
      className="px-5 py-4 hover:bg-gray-50 transition-colors"
      style={{ borderBottom: isLast ? 'none' : '1px solid #e5e7eb' }}
    >
      <div className="flex items-start justify-between">
        {/* Left: project info */}
        <div className="flex-1 min-w-0 mr-4">
          {/* Name + status badge */}
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold" style={{ fontSize: '15px', color: '#111827' }}>
              {project.name}
            </h3>
            <span
              className="px-2 py-0.5 rounded-full capitalize"
              style={{ ...statusStyle, fontSize: '12px' }}
              role="status"
              aria-label={`Status: ${project.status}`}
            >
              {project.status}
            </span>
          </div>

          {/* Description if available */}
          {project.description && (
            <p className="truncate mb-1" style={{ fontSize: '13px', color: '#6b7280' }}>
              {project.description}
            </p>
          )}

          {/* Counts — shown as — until API returns them */}
          <div className="flex items-center gap-4" style={{ fontSize: '12px', color: '#9ca3af' }}>
            <span>{project._count?.tasks ?? '—'} tasks</span>
            <span>{project._count?.members ?? '—'} members</span>
          </div>
        </div>

        {/* Right: open link */}
        {/* NOTE: /board route doesn't exist yet — will work after Project Board page is built */}
        <Link
          to={`/app/teams/${teamId}/projects/${project.id}/board`}
          style={{ fontSize: '13px', color: '#5e6ad2', fontWeight: 500, whiteSpace: 'nowrap' }}
          className="transition-opacity hover:opacity-70"
          aria-label={`Open project ${project.name}`}
        >
          Open →
        </Link>
      </div>
    </div>
  )
}

// ─── MemberRow ────────────────────────────────────────────────────────────────
// WHY this exists separately from the owner display: when the API is updated
// to return a full members array, we can map over it with this component.
// For now it's only used to render the owner.

function MemberRow({ member, isLast }) {
  const initials = getInitials(member.fullName || member.name)
  const role = member.role || 'owner'

  const roleStyle =
    role === 'owner' || role === 'admin'
      ? { backgroundColor: '#ede9fe', color: '#5e6ad2' }
      : { backgroundColor: '#f9fafb', color: '#6b7280' }

  return (
    <div
      className="px-4 py-3"
      style={{ borderBottom: isLast ? 'none' : '1px solid #e5e7eb' }}
    >
      {/* Avatar + name + email */}
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '12px', fontWeight: 600 }}
          role="img"
          aria-label={member.fullName || member.name}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ fontSize: '13px', color: '#111827' }}>
            {member.fullName || member.name}
          </p>
          <p className="truncate" style={{ fontSize: '11px', color: '#9ca3af' }}>
            {member.email}
          </p>
        </div>
      </div>

      {/* Role badge — offset to align under name, past the avatar */}
      <span
        className="px-2 py-0.5 rounded-full inline-block capitalize"
        style={{ ...roleStyle, fontSize: '11px', marginLeft: '44px' }}
      >
        {role}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamDetailPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()

  const [team, setTeam] = useState(null)
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateProject, setShowCreateProject] = useState(false)


  // ── Data fetching ────────────────────────────────────────────────────────────
  // WHY two separate calls: the team endpoint gives us team info + owner + counts,
  // the projects endpoint gives us the actual project list for this team.
  // There is no /api/teams/:id/members endpoint — we display the owner from the
  // team response and the total count from _count.members until the API is updated.
  useEffect(() => {
    const fetchTeamData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch team details — response shape: { team: { ...teamData } }
        const teamRes = await api.get(`/teams/${teamId}`)
        const teamData = teamRes.data.team
        setTeam(teamData)

        // Fetch projects for this team — response shape: { success: true, data: [...] }
        const projectsRes = await api.get(`/projects?teamId=${teamId}`)
        setProjects(projectsRes.data.data ?? [])
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        } else if (err.response?.status === 403 || err.response?.status === 404) {
          setError('not_found')
        } else {
          setError('failed')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamData()
  }, [teamId, navigate])

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Team" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5e6ad2' }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading team...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Not found / no access ────────────────────────────────────────────────────
  if (error === 'not_found' || !team) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Team" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#f9fafb' }}
            >
              <Users size={32} style={{ color: '#9ca3af' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Team not found
            </h2>
            <p className="mb-6" style={{ fontSize: '14px', color: '#9ca3af' }}>
              This team doesn't exist or you don't have access to it.
            </p>
            <Link
              to="/app/teams"
              className="inline-block px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
            >
              Back to Teams
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── General error ────────────────────────────────────────────────────────────
  if (error === 'failed') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Team" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertCircle size={32} style={{ color: '#dc2626' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Failed to load team
            </h2>
            <p className="mb-6" style={{ fontSize: '14px', color: '#6b7280' }}>
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title={team.name} />

      <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-bold" style={{ fontSize: '24px', color: '#111827' }}>
              {team.name}
            </h1>
            {/* Edit button — placeholder, no handler yet. Will be wired in a future session */}
            <button
              aria-label="Edit team details"
              className="p-1 rounded transition-colors hover:bg-gray-100"
            >
              <Edit2 size={16} style={{ color: '#9ca3af' }} />
            </button>
          </div>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            {team.description || 'No description'}
          </p>
        </div>

        {/* 3-column grid: projects (2 cols) + members (1 col) */}
        <div className="grid grid-cols-3 gap-6">

          {/* ── Projects section (col-span-2) ─────────────────────────────── */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ fontSize: '16px', color: '#111827' }}>
                Projects
              </h2>
              <button
                onClick={() => setShowCreateProject(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '13px' }}
              >
                <Plus size={16} aria-hidden="true" />
                Create Project
              </button>
            </div>

            <div
              className="bg-white border rounded-md overflow-hidden"
              style={{ borderColor: '#e5e7eb' }}
            >
              {projects.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FolderKanban size={32} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                    No projects yet. Create your first project to get started.
                  </p>
                </div>
              ) : (
                projects.map((project, index) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    teamId={teamId}
                    isLast={index === projects.length - 1}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Members section (col-span-1) ──────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ fontSize: '16px', color: '#111827' }}>
                Members
                <span
                  className="ml-2 font-normal"
                  style={{ fontSize: '13px', color: '#9ca3af' }}
                >
                  ({team._count?.members ?? 1})
                </span>
              </h2>
            </div>

            <div
              className="bg-white border rounded-md overflow-hidden"
              style={{ borderColor: '#e5e7eb' }}
            >
              {/* WHY only owner: GET /api/teams/:id returns the owner object but
                  no full members array. We display the owner and a note about
                  additional members until the API is updated to include the list. */}
              {team.owner ? (
                <>
                  <MemberRow
                    member={{ ...team.owner, role: 'owner' }}
                    isLast={team._count?.members <= 1}
                  />
                  {team._count?.members > 1 && (
                    <div
                      className="px-4 py-3 text-center"
                      style={{ borderTop: '1px solid #e5e7eb' }}
                    >
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                        +{team._count.members - 1} more member
                        {team._count.members - 1 > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="px-6 py-12 text-center">
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>No members in this team.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Create Project modal — teamId is pre-set so team selector is hidden */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        teamId={teamId}
        onProjectCreated={(newProject) => setProjects((prev) => [newProject, ...prev])}
      />
    </div>
  )
}