import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Plus, AlertCircle, ChevronRight } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'
import TaskDetailPanel from '../components/TaskDetailPanel'

// ─── Constants ────────────────────────────────────────────────────────────────

// These match the exact status values stored in the DB (snake_case).
// We display human-readable labels in the UI.
const COLUMNS = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review',  label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

// Tab definitions for project-level navigation.
// The board tab is always the first — others are placeholders until those pages are built.
const TABS = [
  { id: 'board',    label: 'Board' },
  { id: 'backlog',  label: 'Backlog' },
  { id: 'sprints',  label: 'Sprints' },
  { id: 'members',  label: 'Members' },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

const getPriorityColor = (priority) => {
  const colors = { high: '#dc2626', medium: '#ca8a04', low: '#16a34a' }
  return colors[priority] || colors.medium
}

// Maps DB status key → human-readable label for TaskDetailPanel
const getStatusLabel = (status) => {
  const labels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  }
  return labels[status] || status
}

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

// Formats an ISO date string for sprint banner display.
// e.g. "2026-06-01T00:00:00.000Z" → "Jun 1, 2026"
const formatDate = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── NewTaskModal stub ────────────────────────────────────────────────────────
// WHY a stub: the full modal isn't built yet. The "+ Add Task" button is wired
// and ready. Replace this function when building the modal in a future session.

function NewTaskModal({ isOpen, onClose }) {
  if (!isOpen) return null
  // TODO: Build full NewTaskModal in future session
  return null
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────
// WHY a sub-component: isolates card markup so the column render loop stays clean.

function KanbanCard({ task, onClick }) {
  const priorityColor = getPriorityColor(task.priority)
  const assigneeName = task.assignee?.fullName ?? null
  const initials = assigneeName ? getInitials(assigneeName) : null

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}. Priority: ${task.priority}.${task.storyPoints ? ` ${task.storyPoints} story points.` : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="bg-white rounded-md p-3 cursor-pointer transition-all hover:shadow-sm"
      style={{
        border: '1px solid #e5e7eb',
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
        borderLeftColor: priorityColor,
      }}
    >
      {/* Task title */}
      <p
        className="font-medium mb-3"
        style={{ fontSize: '14px', color: '#111827', lineHeight: '1.4' }}
      >
        {task.title}
      </p>

      {/* Metadata row: priority dot + label + story points / assignee avatar */}
      <div className="flex items-center justify-between">
        {/* Left: priority indicator */}
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: priorityColor }}
            aria-hidden="true"
          />
          <span className="capitalize" style={{ fontSize: '11px', color: '#9ca3af' }}>
            {task.priority || 'medium'}
          </span>
          {task.storyPoints != null && (
            <span
              className="px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#f9fafb', fontSize: '11px', color: '#6b7280' }}
            >
              {task.storyPoints} pts
            </span>
          )}
        </div>

        {/* Right: assignee avatar — only rendered when we have a name */}
        {initials && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '10px' }}
            title={assigneeName}
            aria-label={`Assigned to ${assigneeName}`}
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, onTaskClick, onAddTask }) {
  return (
    <div className="flex flex-col shrink-0" style={{ width: '300px' }}>
      {/* Column header */}
      <div className="flex items-center gap-2 mb-4">
        <h3
          className="font-bold"
          style={{ fontSize: '14px', color: '#111827' }}
          aria-label={`${column.label} column with ${tasks.length} tasks`}
        >
          {column.label}
        </h3>
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: '#f9fafb', color: '#9ca3af', fontSize: '12px' }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Scrollable task list */}
      <div
        className="flex-1 space-y-2 overflow-y-auto pb-2"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
              No tasks yet
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        )}
      </div>

      {/* Add Task button */}
      {/* NOTE: NewTaskModal is a stub (returns null). This is wired and ready.
          Full modal will be built in a future session. */}
      <button
        onClick={onAddTask}
        aria-label={`Add new task to ${column.label} column`}
        className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors mt-2 w-full text-left hover:bg-gray-50"
        style={{ fontSize: '13px', color: '#9ca3af' }}
      >
        <Plus size={16} aria-hidden="true" />
        Add Task
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectBoardPage() {
  const { teamId, projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // ── State ────────────────────────────────────────────────────────────────────
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [activeSprint, setActiveSprint] = useState(null) // null = no active sprint
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null) // null | 'not_found' | 'failed'
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)

  // ── Data fetching ─────────────────────────────────────────────────────────────
  // WHY three parallel calls: project info, tasks, and sprints are independent
  // resources. Fetching them with Promise.all is faster than sequential awaits.
  // We only need the active sprint for the banner — we filter client-side.
  useEffect(() => {
    const fetchBoardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // All three calls run in parallel
        const [projectRes, tasksRes, sprintsRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/tasks`),
          api.get(`/projects/${projectId}/sprints`),
        ])

        // GET /api/projects/:id → { success: true, data: { ...projectObject } }
        setProject(projectRes.data.data)

        // GET /api/projects/:projectId/tasks → { success: true, data: [...tasks] }
        setTasks(tasksRes.data.data ?? [])

        // GET /api/projects/:projectId/sprints → { success: true, data: [...sprints] }
        // Filter client-side for the active sprint — no /active endpoint exists.
        const sprints = sprintsRes.data.data ?? []
        const found = sprints.find((s) => s.status === 'active') ?? null
        setActiveSprint(found)
      } catch (err) {
        if (err.response?.status === 401) {
          // Token expired — send back to login
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

    fetchBoardData()
  }, [projectId, navigate])

  // ── Group tasks into columns ──────────────────────────────────────────────────
  // WHY useMemo: recalculates only when `tasks` changes, not on every render.
  const tasksByColumn = useMemo(() => ({
    todo:        tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    in_review:   tasks.filter((t) => t.status === 'in_review'),
    done:        tasks.filter((t) => t.status === 'done'),
  }), [tasks])

  // ── Task click handler ────────────────────────────────────────────────────────
  // Shapes raw task data into the format TaskDetailPanel expects.
  const handleTaskClick = (task) => {
    setSelectedTask({
      title: task.title,
      description: task.description || 'No description provided.',
      status: getStatusLabel(task.status),
      priority: task.priority || 'medium',
      assignee: task.assignee?.fullName ?? task.assigneeId ?? '—',
      reporter: task.createdBy?.fullName ?? task.createdById ?? '—',
      sprint: activeSprint?.name ?? '—',
      points: task.storyPoints ?? '—',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—',
      created: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—',
    })
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Board" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5e6ad2' }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading board...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Not found / no access ─────────────────────────────────────────────────────
  if (error === 'not_found' || !project) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Board" />
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
        <TopBar title="Board" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertCircle size={32} style={{ color: '#dc2626' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Failed to load board
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
        {/* WHY nav + aria-label: screen readers announce this as a navigation landmark */}
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
            {/* We don't have the team name here without an extra fetch.
                The team name would require fetching /api/teams/:teamId.
                To avoid a 4th API call, we show a neutral label.
                This can be improved later if the parent passes team name via state. */}
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
        {/* WHY role="tablist": communicates tab semantics to screen readers */}
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
                {/* Active underline indicator */}
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

      {/* ── Sprint banner ─────────────────────────────────────────────────────── */}
      <div
        className="px-8 py-3 bg-white shrink-0"
        style={{ borderBottom: '1px solid #e5e7eb' }}
        role="region"
        aria-label="Active sprint information"
      >
        {activeSprint ? (
          <div className="flex items-center justify-between">
            <span className="font-semibold" style={{ fontSize: '14px', color: '#111827' }}>
              {activeSprint.name}
            </span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {formatDate(activeSprint.startDate)} – {formatDate(activeSprint.endDate)}
            </span>
          </div>
        ) : (
          // No active sprint — show a prompt to start one
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold" style={{ fontSize: '14px', color: '#111827' }}>
                No Active Sprint
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                Start a sprint to begin tracking progress
              </p>
            </div>
            {/* Placeholder — sprint management will be built on the Sprints page */}
            <button
              className="px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '13px' }}
              onClick={() =>
                navigate(`/app/teams/${teamId}/projects/${projectId}/sprints`)
              }
            >
              Start Sprint
            </button>
          </div>
        )}
      </div>

      {/* ── Kanban board ──────────────────────────────────────────────────────── */}
      {tasks.length === 0 ? (
        // All-columns-empty state — shown when the project has no tasks at all
        <div className="flex-1 flex items-center justify-center p-6" style={{ backgroundColor: '#f8f9fb' }}>
          <div className="text-center">
            <h3 className="font-bold mb-2" style={{ fontSize: '16px', color: '#111827' }}>
              No tasks yet
            </h3>
            <p className="mb-4" style={{ fontSize: '14px', color: '#9ca3af' }}>
              Create tasks to start tracking work on this project
            </p>
            <button
              onClick={() => setShowNewTask(true)}
              className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
            >
              Create Task
            </button>
          </div>
        </div>
      ) : (
        // Normal board — horizontal scroll, 4 columns
        <div
          className="flex-1 overflow-x-auto p-6"
          style={{ backgroundColor: '#f8f9fb' }}
          aria-label="Project Board - Kanban"
        >
          <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id]}
                onTaskClick={handleTaskClick}
                onAddTask={() => setShowNewTask(true)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Task detail slide-over panel ──────────────────────────────────────── */}
      <TaskDetailPanel
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />

      {/* ── New Task modal stub ───────────────────────────────────────────────── */}
      <NewTaskModal isOpen={showNewTask} onClose={() => setShowNewTask(false)} />
    </div>
  )
}