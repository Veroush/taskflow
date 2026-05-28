import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Plus, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'board',   label: 'Board' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'members', label: 'Members' },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

// Returns background + text color for a sprint status value.
const getStatusStyle = (status) => {
  const styles = {
    planned:   { bg: '#f9fafb', text: '#6b7280' },
    active:    { bg: '#ede9fe', text: '#5e6ad2' },
    completed: { bg: '#dcfce7', text: '#16a34a' },
  }
  return styles[status] || styles.planned
}

// Returns background + text color for a task status value.
// WHY: task statuses come from the DB as snake_case — we map both the style
// and the display label in one place.
const getTaskStatusStyle = (status) => {
  const styles = {
    todo:        { bg: '#f9fafb', text: '#6b7280',  label: 'To Do' },
    in_progress: { bg: '#ede9fe', text: '#5e6ad2',  label: 'In Progress' },
    in_review:   { bg: '#f3e8ff', text: '#9333ea',  label: 'In Review' },
    done:        { bg: '#dcfce7', text: '#16a34a',  label: 'Done' },
  }
  return styles[status] || styles.todo
}

// Formats an ISO date string for display.
// e.g. "2026-06-01T00:00:00.000Z" → "Jun 1, 2026"
const formatDate = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── SprintCard ───────────────────────────────────────────────────────────────
// WHY a sub-component: each card manages its own expanded state reference
// and keeps the main render loop clean.

function SprintCard({ sprint, tasks, isExpanded, onToggle, onStartSprint, onCompleteSprint }) {
  const statusStyle = getStatusStyle(sprint.status)

  // Tasks belonging to this sprint — filtered from the full project task list.
  // WHY filter here not in parent: SprintCard receives all tasks and filters
  // itself, keeping the parent fetch logic simple (one tasks array, shared).
  const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id)

  return (
    <div
      className="bg-white border rounded-md overflow-hidden"
      style={{ borderColor: '#e5e7eb' }}
      role="region"
      aria-label={sprint.name}
    >
      <div className="p-5">
        {/* Sprint header row */}
        <div className="flex items-start justify-between">

          {/* Left: sprint info */}
          <div className="flex-1">
            {/* Name + status badge */}
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold" style={{ fontSize: '15px', color: '#111827' }}>
                {sprint.name}
              </h3>
              <span
                className="px-2 py-1 rounded-full capitalize"
                style={{
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                  fontSize: '12px',
                }}
              >
                {sprint.status}
              </span>
            </div>

            {/* Date range */}
            <p style={{ fontSize: '13px', color: '#9ca3af' }} className="mb-1">
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </p>

            {/* Task count */}
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {sprintTasks.length} {sprintTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>

          {/* Right: action buttons + expand toggle */}
          <div className="flex items-center gap-2">
            {/* Start Sprint — only shown for planned sprints */}
            {sprint.status === 'planned' && (
              <button
                onClick={() => onStartSprint(sprint.id)}
                aria-label={`Start ${sprint.name}`}
                className="px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '13px' }}
              >
                Start Sprint
              </button>
            )}

            {/* Complete Sprint — only shown for active sprints */}
            {sprint.status === 'active' && (
              <button
                onClick={() => onCompleteSprint(sprint.id)}
                aria-label={`Complete ${sprint.name}`}
                className="px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#16a34a', color: 'white', fontSize: '13px' }}
              >
                Complete Sprint
              </button>
            )}

            {/* Expand/collapse — only shown when sprint has tasks */}
            {sprintTasks.length > 0 && (
              <button
                onClick={onToggle}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${sprint.name} tasks`}
                aria-expanded={isExpanded}
                className="p-1 rounded transition-colors hover:bg-gray-50"
              >
                <ChevronDown
                  size={18}
                  style={{
                    color: '#6b7280',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            )}
          </div>
        </div>

        {/* Task list — only rendered when expanded and tasks exist */}
        {isExpanded && sprintTasks.length > 0 && (
          <div
            className="mt-4 pt-4 space-y-2"
            style={{ borderTop: '1px solid #e5e7eb' }}
            role="list"
            aria-label={`Tasks in ${sprint.name}`}
          >
            {sprintTasks.map((task) => {
              const taskStyle = getTaskStatusStyle(task.status)
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md"
                  style={{ backgroundColor: '#f9fafb' }}
                  role="listitem"
                >
                  <span style={{ fontSize: '14px', color: '#111827' }}>
                    {task.title}
                  </span>
                  <span
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: taskStyle.bg,
                      color: taskStyle.text,
                      fontSize: '12px',
                    }}
                  >
                    {taskStyle.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SprintsPage() {
  const { teamId, projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // ── State ────────────────────────────────────────────────────────────────────
  const [project, setProject] = useState(null)
  const [sprints, setSprints] = useState([])
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null) // null | 'not_found' | 'failed'

  // Set of sprint IDs that are currently expanded.
  // WHY a Set: O(1) lookup for has/add/delete vs array includes().
  // WHY start with active sprint expanded: most useful default view.
  const [expandedSprints, setExpandedSprints] = useState(new Set())

  // ── Data fetching ─────────────────────────────────────────────────────────────
  // WHY three parallel calls: project info, sprints, and tasks are independent.
  // WHY fetch all tasks here: no endpoint exists to fetch tasks by sprint.
  // We filter tasks per sprint inside each SprintCard using task.sprintId.
  useEffect(() => {
    const fetchSprintsData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [projectRes, sprintsRes, tasksRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/sprints`),
          api.get(`/projects/${projectId}/tasks`),
        ])

        // GET /api/projects/:id → { success: true, data: { ...projectObject } }
        setProject(projectRes.data.data)

        // GET /api/projects/:projectId/sprints → { success: true, data: [...sprints] }
        const sprintsData = sprintsRes.data.data ?? []
        setSprints(sprintsData)

        // GET /api/projects/:projectId/tasks → { success: true, data: [...tasks] }
        setTasks(tasksRes.data.data ?? [])

        // Auto-expand the active sprint if one exists.
        // WHY: the active sprint is the most relevant — expanding it by default
        // saves the user a click and surfaces current work immediately.
        const activeSprint = sprintsData.find((s) => s.status === 'active')
        if (activeSprint) {
          setExpandedSprints(new Set([activeSprint.id]))
        }
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

    fetchSprintsData()
  }, [projectId, navigate])

  // ── Toggle sprint expansion ───────────────────────────────────────────────────
  // WHY functional update: guarantees we're working with the latest state,
  // not a stale closure value.
  const toggleSprint = (sprintId) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev)
      if (next.has(sprintId)) {
        next.delete(sprintId)
      } else {
        next.add(sprintId)
      }
      return next
    })
  }

  // ── Start sprint handler ──────────────────────────────────────────────────────
  // Calls PATCH /api/sprints/:id with status: 'active'.
  // Updates state locally on success — no need to refetch everything.
  const handleStartSprint = async (sprintId) => {
    try {
      await api.patch(`/sprints/${sprintId}`, { status: 'active' })
      setSprints((prev) =>
        prev.map((s) => (s.id === sprintId ? { ...s, status: 'active' } : s))
      )
    } catch (err) {
      // Silent fail for now — full error handling will come with toast notifications
      console.error('Failed to start sprint:', err)
    }
  }

  // ── Complete sprint handler ───────────────────────────────────────────────────
  // Calls PATCH /api/sprints/:id with status: 'completed'.
  // Updates state locally on success.
  const handleCompleteSprint = async (sprintId) => {
    try {
      await api.patch(`/sprints/${sprintId}`, { status: 'completed' })
      setSprints((prev) =>
        prev.map((s) => (s.id === sprintId ? { ...s, status: 'completed' } : s))
      )
    } catch (err) {
      console.error('Failed to complete sprint:', err)
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Sprints" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5e6ad2' }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading sprints...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Not found / no access ─────────────────────────────────────────────────────
  if (error === 'not_found' || !project) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Sprints" />
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
        <TopBar title="Sprints" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertCircle size={32} style={{ color: '#dc2626' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Failed to load sprints
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

      {/* ── Header: breadcrumb + title + tabs ────────────────────────────────── */}
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

        {/* Page title */}
        <h1 className="font-bold mb-4" style={{ fontSize: '20px', color: '#111827' }}>
          {project.name}
        </h1>

        {/* Project tabs */}
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

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold" style={{ fontSize: '16px', color: '#111827' }}>
            Sprints
            <span className="ml-2 font-normal" style={{ fontSize: '13px', color: '#9ca3af' }}>
              ({sprints.length})
            </span>
          </h2>
          {/* Create Sprint — stub, no handler yet */}
          {/* TODO: wire to CreateSprintModal in future session */}
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '13px' }}
          >
            <Plus size={16} aria-hidden="true" />
            Create Sprint
          </button>
        </div>

        {/* Sprint list or empty state */}
        {sprints.length === 0 ? (
          <div
            className="bg-white border rounded-md p-12"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="text-center">
              <h3 className="font-bold mb-2" style={{ fontSize: '16px', color: '#111827' }}>
                No sprints yet
              </h3>
              <p className="mb-4" style={{ fontSize: '14px', color: '#9ca3af' }}>
                Create your first sprint to start planning work
              </p>
              <button
                className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
              >
                Create Sprint
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sprints.map((sprint) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                tasks={tasks}
                isExpanded={expandedSprints.has(sprint.id)}
                onToggle={() => toggleSprint(sprint.id)}
                onStartSprint={handleStartSprint}
                onCompleteSprint={handleCompleteSprint}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}