import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'
import TaskDetailPanel from '../components/TaskDetailPanel'
import NewTaskModal from '../components/NewTaskModal'

// ─── Constants ────────────────────────────────────────────────────────────────

// These match the exact status values your Prisma schema stores in the DB.
// We map them to human-readable column titles for display.
const COLUMNS = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review',  label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

const getPriorityColor = (priority) => {
  const colors = { high: '#dc2626', medium: '#ca8a04', low: '#16a34a' }
  return colors[priority] || colors.medium
}

const getStatusLabel = (status) => {
  const labels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  }
  return labels[status] || status
}

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────
// WHY a sub-component: keeps the column render loop clean and makes the card
// logic easy to read and maintain in isolation.

function KanbanCard({ task, onClick }) {
  const priorityColor = getPriorityColor(task.priority)

  // Build assignee initials from whatever data the API returns.
  // The task API currently returns assigneeId (a UUID), not a joined user object.
  // So we fall back gracefully — when the API is updated to include the full user,
  // this will automatically show their initials.
  const assigneeName =
    task.assignee?.fullName ?? task.assignee?.name ?? null
  const initials = assigneeName ? getInitials(assigneeName) : null

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}. Priority: ${task.priority}. ${task.storyPoints ? task.storyPoints + ' story points.' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="bg-white rounded-md p-3 cursor-pointer transition-all hover:shadow-sm border-l-4"
      style={{
        borderLeftColor: priorityColor,
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

      {/* Project name (if available) */}
      {task.projectName && (
        <p className="mb-2 truncate" style={{ fontSize: '11px', color: '#9ca3af' }}>
          {task.projectName}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex items-center justify-between">
        {/* Left: priority dot + label + story points */}
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: priorityColor }}
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

        {/* Right: assignee avatar (only shown when we have a name) */}
        {initials && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '10px' }}
            title={assigneeName}
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────
// WHY a sub-component: each column has its own header, scrollable task list,
// and Add Task button. Extracting it keeps MyTasksPage readable.

function KanbanColumn({ column, tasks, onTaskClick, onAddTask }) {
  return (
    <div className="flex flex-col shrink-0" style={{ width: '300px' }}>
      {/* Column header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold" style={{ fontSize: '14px', color: '#111827' }}>
          {column.label}
        </h3>
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: '#f9fafb', color: '#9ca3af', fontSize: '12px' }}
          aria-label={`${tasks.length} tasks`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Scrollable task list */}
      <div
        className="flex-1 space-y-2 overflow-y-auto pb-2"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
        aria-label={`${column.label} column with ${tasks.length} tasks`}
      >
        {tasks.length === 0 ? (
          // Empty column state — shown only when OTHER columns have tasks.
          // The "all empty" state is handled at the page level.
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: '#f9fafb' }}
              >
                <CheckCircle2 size={20} style={{ color: '#d1d5db' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No tasks</p>
            </div>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        )}
      </div>

      {/* Add Task button */}
      {/* NOTE: NewTaskModal is not built yet. This button is wired but the modal
          is a stub (returns null). It will be fully implemented in a future session. */}
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

// NewTaskModal is now a real shared component — imported at the top of this file.

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)

  // Read the current user from localStorage.
  // WHY we extract userId as a plain string: if we put the whole `user` object
  // in the useEffect dependency array, React sees a new object reference on every
  // render (even though the value is identical) and re-runs the fetch in a loop.
  // A primitive string like userId is stable — React can compare it correctly.
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch {
      return {}
    }
  })()
  const userId = user.id ?? null

  // ── Data fetching ────────────────────────────────────────────────────────────
  // WHY this strategy: There's no GET /api/tasks/my-tasks endpoint.
  // Instead we mirror DashboardPage: teams → projects → tasks, then filter
  // to only tasks where assigneeId matches the logged-in user's id.
  useEffect(() => {
    const fetchMyTasks = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Step 1: get all teams the user belongs to
        // Response shape: { teams: [...] }
        const teamsRes = await api.get('/teams')
        const teamsData = teamsRes.data.teams ?? []

        // Step 2: get all projects across all teams
        // Response shape: { success: true, data: [...] }
        let allProjects = []
        await Promise.all(
          teamsData.map(async (team) => {
            try {
              const projectsRes = await api.get(`/projects?teamId=${team.id}`)
              const projects = projectsRes.data.data ?? []
              allProjects = [...allProjects, ...projects]
            } catch {
              // If one team's projects fail, keep going with the others
            }
          })
        )

        // Step 3: get all tasks across all projects, then filter to assigned ones
        // Response shape: { success: true, data: [...] }
        let myTasks = []
        await Promise.all(
          allProjects.map(async (project) => {
            try {
              const tasksRes = await api.get(`/projects/${project.id}/tasks`)
              const tasks = tasksRes.data.data ?? []

              // Filter: only tasks where this user is the assignee
              const assigned = tasks.filter((t) => t.assigneeId === userId)

              // Attach project name for display in the card
              const withProject = assigned.map((t) => ({
                ...t,
                projectName: project.name,
              }))

              myTasks = [...myTasks, ...withProject]
            } catch {
              // Continue if one project fails
            }
          })
        )

        setTasks(myTasks)
      } catch (err) {
        if (err.response?.status === 401) {
          // Token expired or invalid — send back to login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        } else {
          setError('Failed to load your tasks. Please refresh the page.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyTasks()
  }, [navigate, userId])

  // ── Organize tasks into columns ──────────────────────────────────────────────
  // WHY useMemo: this recalculates only when `tasks` changes, not on every render.
  // It groups tasks by their DB status value (todo, in_progress, etc.)
  const tasksByColumn = useMemo(() => {
    return {
      todo:        tasks.filter((t) => t.status === 'todo'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      in_review:   tasks.filter((t) => t.status === 'in_review'),
      done:        tasks.filter((t) => t.status === 'done'),
    }
  }, [tasks])

  // ── Task click handler ───────────────────────────────────────────────────────
  // Builds the shape that TaskDetailPanel expects from the raw task object.
  const handleTaskClick = (task) => {
    setSelectedTask({
      title: task.title,
      description: task.description || 'No description provided.',
      status: getStatusLabel(task.status),
      priority: task.priority || 'medium',
      // These show raw IDs for now — will show names once the API returns joined user data
      assignee: task.assignee?.fullName ?? task.assigneeId ?? '—',
      reporter: task.createdBy?.fullName ?? task.createdById ?? '—',
      sprint: task.sprint?.name ?? task.sprintId ?? '—',
      points: task.storyPoints ?? '—',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—',
      created: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—',
    })
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="My Tasks" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5e6ad2' }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading your tasks...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="My Tasks" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertCircle size={32} style={{ color: '#dc2626' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Failed to load tasks
            </h2>
            <p className="mb-6" style={{ fontSize: '14px', color: '#6b7280' }}>
              {error}
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

  // ── Empty state (no tasks assigned at all) ───────────────────────────────────
  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="My Tasks" />
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f8f9fb' }}>
          <div className="text-center max-w-md">
            <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: '#9ca3af' }} />
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              No tasks assigned to you
            </h2>
            <p className="mb-6" style={{ fontSize: '14px', color: '#6b7280' }}>
              Tasks assigned to you will appear here across all your projects.
            </p>
            <button
              onClick={() => setShowNewTask(true)}
              className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
            >
              Create Your First Task
            </button>
          </div>
        </div>

        {/* Modal stub — will be built in a future session */}
        {/* NOTE: MyTasksPage has no projectId — modal will show a "no project" error.
            Creating tasks from My Tasks requires a project context. This will be
            improved in a future session when we add a project picker to the modal. */}
        <NewTaskModal
          isOpen={showNewTask}
          onClose={() => setShowNewTask(false)}
          onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
          projectId={null}
        />
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden" aria-label="My Tasks - Kanban Board">
      <TopBar title="My Tasks" />

      {/* Horizontal scroll container — allows columns to extend past viewport */}
      <div className="flex-1 overflow-x-auto p-6" style={{ backgroundColor: '#f8f9fb' }}>
        {/* Kanban columns flex container */}
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

      {/* Task detail slide-over panel */}
      <TaskDetailPanel
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />

      {/* New Task modal */}
      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        onTaskCreated={(task) => setTasks((prev) => [task, ...prev])}
        projectId={null}
      />
    </div>
  )
}