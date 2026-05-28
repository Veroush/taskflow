import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { Plus, AlertCircle, ChevronRight } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'
import TaskDetailPanel from '../components/TaskDetailPanel'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'board',   label: 'Board' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'members', label: 'Members' },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

// Returns background + text color for a priority value.
const getPriorityStyle = (priority) => {
  const styles = {
    high:   { bg: '#fee2e2', text: '#dc2626' },
    medium: { bg: '#fef9c3', text: '#ca8a04' },
    low:    { bg: '#dcfce7', text: '#16a34a' },
  }
  return styles[priority] || styles.medium
}

// Maps DB status key → human-readable label for display and TaskDetailPanel.
const getStatusLabel = (status) => {
  const labels = {
    todo:        'To Do',
    in_progress: 'In Progress',
    in_review:   'In Review',
    done:        'Done',
  }
  return labels[status] || status
}

// Derives 1-2 uppercase initials from a full name string.
const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── NewTaskModal stub ────────────────────────────────────────────────────────
// WHY a stub: the full modal isn't built yet. The "Create Task" button is wired
// and ready. Replace this function when building the modal in a future session.

function NewTaskModal({ isOpen, onClose }) {
  if (!isOpen) return null
  // TODO: Build full NewTaskModal in future session
  return null
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────
// WHY a sub-component: isolates row markup so the table render loop stays clean.

function TaskRow({ task, onTaskClick, isLast }) {
  const priorityStyle = getPriorityStyle(task.priority)
  const assigneeName = task.assignee?.fullName ?? null
  const initials = assigneeName ? getInitials(assigneeName) : null
  const statusLabel = getStatusLabel(task.status)

  return (
    <div
      role="row"
      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
      style={{ borderBottom: isLast ? 'none' : '1px solid #e5e7eb' }}
    >
      {/* Task title — clickable, opens TaskDetailPanel */}
      <div className="col-span-5" role="cell">
        <button
          onClick={() => onTaskClick(task)}
          aria-label={`View details for ${task.title}`}
          className="font-medium text-left hover:underline w-full"
          style={{ fontSize: '14px', color: '#111827' }}
        >
          {task.title}
        </button>
      </div>

      {/* Status badge */}
      <div className="col-span-2" role="cell">
        <span
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: '#f9fafb', color: '#6b7280', fontSize: '12px' }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Priority badge */}
      <div className="col-span-2" role="cell">
        <span
          className="px-2 py-1 rounded-full capitalize"
          style={{
            backgroundColor: priorityStyle.bg,
            color: priorityStyle.text,
            fontSize: '12px',
          }}
        >
          {task.priority || 'medium'}
        </span>
      </div>

      {/* Assignee avatar */}
      <div className="col-span-1" role="cell">
        {initials ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '10px' }}
            role="img"
            aria-label={assigneeName}
            title={assigneeName}
          >
            {initials}
          </div>
        ) : (
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>—</span>
        )}
      </div>

      {/* Story points */}
      <div className="col-span-1" role="cell" style={{ fontSize: '13px', color: '#6b7280' }}>
        {task.storyPoints != null ? task.storyPoints : '—'}
      </div>

      {/* Add to Sprint button */}
      {/* NOTE: No handler yet — sprint assignment will be built in the Sprints page session */}
      <div className="col-span-1 flex justify-end" role="cell">
        <button
          aria-label={`Add ${task.title} to sprint`}
          className="px-3 py-1 rounded-md border transition-colors hover:text-white"
          style={{
            color: '#5e6ad2',
            borderColor: '#5e6ad2',
            fontSize: '12px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5e6ad2'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#5e6ad2'
          }}
          onClick={() => {
            // TODO: open sprint selection modal in future session
          }}
        >
          + Sprint
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BacklogPage() {
  const { teamId, projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // ── State ────────────────────────────────────────────────────────────────────
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null) // null | 'not_found' | 'failed'
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)

  // ── Data fetching ─────────────────────────────────────────────────────────────
  // WHY two parallel calls: project info and tasks are independent.
  // WHY filter client-side: there is no /backlog endpoint. We fetch all tasks
  // and filter for sprintId === null — those are the unassigned backlog items.
  useEffect(() => {
    const fetchBacklogData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [projectRes, tasksRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/tasks`),
        ])

        // GET /api/projects/:id → { success: true, data: { ...projectObject } }
        setProject(projectRes.data.data)

        // GET /api/projects/:projectId/tasks → { success: true, data: [...tasks] }
        // Filter client-side: backlog = tasks with no sprint assigned
        const allTasks = tasksRes.data.data ?? []
        const backlogTasks = allTasks.filter((t) => t.sprintId === null)
        setTasks(backlogTasks)
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

    fetchBacklogData()
  }, [projectId, navigate])

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
      sprint: '—',
      points: task.storyPoints ?? '—',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—',
      created: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—',
    })
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Backlog" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5e6ad2' }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading backlog...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Not found / no access ─────────────────────────────────────────────────────
  if (error === 'not_found' || !project) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Backlog" />
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
        <TopBar title="Backlog" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertCircle size={32} style={{ color: '#dc2626' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Failed to load backlog
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
            Backlog
            <span className="ml-2 font-normal" style={{ fontSize: '13px', color: '#9ca3af' }}>
              ({tasks.length})
            </span>
          </h2>
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '13px' }}
          >
            <Plus size={16} aria-hidden="true" />
            Create Task
          </button>
        </div>

        {/* Backlog table */}
        <div
          className="bg-white border rounded-md overflow-hidden"
          style={{ borderColor: '#e5e7eb' }}
          role="table"
          aria-label="Backlog tasks"
        >
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-4 px-6 py-3"
            style={{
              borderBottom: '1px solid #e5e7eb',
              fontSize: '13px',
              fontWeight: 600,
              color: '#6b7280',
            }}
            role="row"
          >
            <div className="col-span-5" role="columnheader">Task</div>
            <div className="col-span-2" role="columnheader">Status</div>
            <div className="col-span-2" role="columnheader">Priority</div>
            <div className="col-span-1" role="columnheader">Assignee</div>
            <div className="col-span-1" role="columnheader">Points</div>
            <div className="col-span-1" role="columnheader" aria-label="Actions" />
          </div>

          {/* Table body */}
          {tasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <h3 className="font-bold mb-2" style={{ fontSize: '16px', color: '#111827' }}>
                No tasks in backlog
              </h3>
              <p className="mb-4" style={{ fontSize: '14px', color: '#9ca3af' }}>
                Create your first task to get started
              </p>
              <button
                onClick={() => setShowNewTask(true)}
                className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
              >
                Create Task
              </button>
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                onTaskClick={handleTaskClick}
                isLast={index === tasks.length - 1}
              />
            ))
          )}
        </div>
      </div>

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