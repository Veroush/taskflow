import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { AlertCircle, ChevronRight, Users } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'

// ─── Constants ────────────────────────────────────────────────────────────────

// Tab definitions — shared pattern across all project-level pages.
// Active tab is detected via location.pathname so Links stay in sync.
const TABS = [
  { id: 'board',   label: 'Board' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'members', label: 'Members' },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

// Derives 1-2 uppercase initials from a full name string.
// e.g. "Test User" → "TU", "Alice" → "A"
const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Maps a role string to a badge color style.
// admin gets purple, member gets grey.
const getRoleStyle = (role) => {
  if (role === 'admin') return { backgroundColor: '#ede9fe', color: '#5e6ad2' }
  return { backgroundColor: '#f9fafb', color: '#6b7280' }
}

// Formats an ISO date string to a readable join date.
// e.g. "2026-05-26T10:38:53.920Z" → "May 26, 2026"
const formatJoinDate = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── MemberCard ───────────────────────────────────────────────────────────────
// WHY a sub-component: isolates member row markup so the list render stays clean.
// Each card shows: avatar initials, full name, email, role badge, join date.

function MemberCard({ member, isLast }) {
  const initials = getInitials(member.user.fullName)
  const roleStyle = getRoleStyle(member.role)

  return (
    <div
      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      style={{ borderBottom: isLast ? 'none' : '1px solid #e5e7eb' }}
    >
      {/* Left: avatar + name + email */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '13px', fontWeight: 600 }}
          role="img"
          aria-label={member.user.fullName}
        >
          {initials}
        </div>
        <div>
          <p className="font-medium" style={{ fontSize: '14px', color: '#111827' }}>
            {member.user.fullName}
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            {member.user.email}
          </p>
        </div>
      </div>

      {/* Right: role badge + join date */}
      <div className="flex items-center gap-4 shrink-0">
        <span
          className="px-2 py-0.5 rounded-full capitalize"
          style={{ ...roleStyle, fontSize: '12px' }}
        >
          {member.role}
        </span>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          Joined {formatJoinDate(member.joinedAt)}
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectMembersPage() {
  const { teamId, projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // ── State ─────────────────────────────────────────────────────────────────────
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null) // null | 'not_found' | 'failed'

  // ── Data fetching ─────────────────────────────────────────────────────────────
  // WHY a single call: GET /api/projects/:id already returns the members array
  // nested inside the project object. No second request needed.
  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // GET /api/projects/:id → { success: true, data: { ...project, members: [...] } }
        const res = await api.get(`/projects/${projectId}`)
        const projectData = res.data.data
        setProject(projectData)
        setMembers(projectData.members ?? [])
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

    fetchProjectData()
  }, [projectId, navigate])

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Members" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5e6ad2' }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading members...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Not found / no access ─────────────────────────────────────────────────────
  if (error === 'not_found' || !project) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Members" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#f9fafb' }}
            >
              <AlertCircle size={32} style={{ color: '#9ca3af' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Project not found
            </h2>
            <p className="mb-6" style={{ fontSize: '14px', color: '#9ca3af' }}>
              This project doesn't exist or you don't have access to it.
            </p>
            <Link
              to={`/app/teams/${teamId}`}
              className="inline-block px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
            >
              Back to Team
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── General error ─────────────────────────────────────────────────────────────
  if (error === 'failed') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Members" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertCircle size={32} style={{ color: '#dc2626' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Failed to load members
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

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title={project.name} />

      {/* ── Header: breadcrumb + title + tabs ──────────────────────────────────── */}
      <div
        className="px-8 pt-6 pb-0 bg-white shrink-0"
        style={{ borderBottom: '1px solid #e5e7eb' }}
      >
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 mb-4">
          <Link
            to="/app/teams"
            style={{ fontSize: '13px', color: '#6b7280' }}
            className="hover:text-gray-900 transition-colors"
          >
            Teams
          </Link>
          <ChevronRight size={14} style={{ color: '#9ca3af' }} aria-hidden="true" />
          <Link
            to={`/app/teams/${teamId}`}
            style={{ fontSize: '13px', color: '#6b7280' }}
            className="hover:text-gray-900 transition-colors"
          >
            Team
          </Link>
          <ChevronRight size={14} style={{ color: '#9ca3af' }} aria-hidden="true" />
          <span style={{ fontSize: '13px', color: '#111827' }}>{project.name}</span>
        </nav>

        {/* Page title + member count chip */}
        <div className="flex items-center gap-3 mb-4">
          <h1 className="font-bold" style={{ fontSize: '20px', color: '#111827' }}>
            {project.name}
          </h1>
          <span
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '12px' }}
          >
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Project tabs — same TABS constant, same active detection as other pages */}
        <div className="flex items-center gap-0" role="tablist">
          {TABS.map((tab) => {
            const tabPath = `/app/teams/${teamId}/projects/${projectId}/${tab.id}`
            const isActive = location.pathname === tabPath

            return (
              <Link
                key={tab.id}
                to={tabPath}
                role="tab"
                aria-selected={isActive}
                className="px-4 py-3 relative transition-colors"
                style={{
                  fontSize: '14px',
                  color: isActive ? '#5e6ad2' : '#6b7280',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                }}
              >
                {tab.label}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: '2px',
                      backgroundColor: '#5e6ad2',
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Members list ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>
        <div className="max-w-2xl">

          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ fontSize: '16px', color: '#111827' }}>
              Project Members
            </h2>
          </div>

          {/* Members card list */}
          <div
            className="bg-white border rounded-md overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            {members.length === 0 ? (
              // Empty state — shouldn't happen in practice since creator is auto-enrolled
              <div className="px-6 py-12 text-center">
                <Users size={32} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  No members found for this project.
                </p>
              </div>
            ) : (
              members.map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isLast={index === members.length - 1}
                />
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}