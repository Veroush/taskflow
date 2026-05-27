import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Zap, CheckCircle2, Clock, Users } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'
import StatCard from '../components/StatCard'
import TaskDetailPanel from '../components/TaskDetailPanel'

// ─── Helper functions ────────────────────────────────────────────────────────

const getPriorityColor = (priority) => {
  const colors = { high: '#dc2626', medium: '#ca8a04', low: '#16a34a' }
  return colors[priority] || colors.medium
}

const getStatusStyle = (status) => {
  const styles = {
    todo: { bg: '#f9fafb', text: '#6b7280', label: 'To Do' },
    in_progress: { bg: '#ede9fe', text: '#5e6ad2', label: 'In Progress' },
    in_review: { bg: '#f3e8ff', text: '#9333ea', label: 'In Review' },
    done: { bg: '#dcfce7', text: '#16a34a', label: 'Done' },
    // Fallback for display-string status values
    'To Do': { bg: '#f9fafb', text: '#6b7280', label: 'To Do' },
    'In Progress': { bg: '#ede9fe', text: '#5e6ad2', label: 'In Progress' },
    'In Review': { bg: '#f3e8ff', text: '#9333ea', label: 'In Review' },
    Done: { bg: '#dcfce7', text: '#16a34a', label: 'Done' },
  }
  return styles[status] || styles.todo
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

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TaskRow({ task, onClick }) {
  const statusStyle = getStatusStyle(task.status)
  const statusLabel = getStatusLabel(task.status)
  const priorityColor = getPriorityColor(task.priority)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open task: ${task.title}. Priority: ${task.priority}. Status: ${statusLabel}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-gray-50"
      style={{ borderColor: '#e5e7eb' }}
    >
      {/* Priority dot */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: priorityColor }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium truncate"
          style={{ fontSize: '14px', color: '#111827' }}
        >
          {task.title}
        </p>
        {task.projectName && (
          <p className="truncate" style={{ fontSize: '12px', color: '#9ca3af' }}>
            {task.projectName}
          </p>
        )}
      </div>

      {/* Status badge */}
      <span
        className="px-2 py-0.5 rounded-full shrink-0"
        role="status"
        style={{
          backgroundColor: statusStyle.bg,
          color: statusStyle.text,
          fontSize: '12px',
        }}
      >
        {statusLabel}
      </span>
    </div>
  )
}

function TeamRow({ team, onViewClick }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-gray-50"
      style={{ borderColor: '#e5e7eb' }}
    >
      <div>
        <p className="font-medium" style={{ fontSize: '14px', color: '#111827' }}>
          {team.name}
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
          {team.memberCount ?? team._count?.members ?? '—'} members
        </p>
      </div>
      <button
        onClick={onViewClick}
        className="transition-colors hover:underline"
        style={{ fontSize: '13px', color: '#5e6ad2' }}
      >
        View →
      </button>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [teams, setTeams] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeSprints: 0,
    tasksTodo: 0,
    tasksCompleted: 0,
  })

  const [selectedTask, setSelectedTask] = useState(null)

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch {
      return {}
    }
  })()

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 1. Fetch user's teams — shape: { teams: [...] }
        const teamsRes = await api.get('/teams')
        const teamsData = teamsRes.data.teams ?? []
        setTeams(teamsData)

        // 2. For each team, fetch projects — shape: { success, data: [...] }
        let allProjects = []
        await Promise.all(
          teamsData.map(async (team) => {
            try {
              const projectsRes = await api.get(`/projects?teamId=${team.id}`)
              const projects = projectsRes.data.data ?? []
              allProjects = [...allProjects, ...projects]
            } catch {
              // If one team's projects fail, continue with others
            }
          })
        )

        // 3. For each project, fetch tasks — shape: { success, data: [...] }
        let allTasks = []
        await Promise.all(
          allProjects.map(async (project) => {
            try {
              const tasksRes = await api.get(`/projects/${project.id}/tasks`)
              const tasks = tasksRes.data.data ?? []
              // Attach project name to each task for display
              const tasksWithProject = tasks.map((t) => ({
                ...t,
                projectName: project.name,
              }))
              allTasks = [...allTasks, ...tasksWithProject]
            } catch {
              // Continue if one project's tasks fail
            }
          })
        )

        // 4. For each project, fetch sprints — shape: { success, data: [...] }
        let activeSprints = 0
        await Promise.all(
          allProjects.map(async (project) => {
            try {
              const sprintsRes = await api.get(`/projects/${project.id}/sprints`)
              const sprints = sprintsRes.data.data ?? []
              activeSprints += sprints.filter((s) => s.status === 'active').length
            } catch {
              // Continue
            }
          })
        )

        // 5. Derive stats from real data
        const tasksTodo = allTasks.filter((t) => t.status === 'todo').length
        const tasksCompleted = allTasks.filter((t) => t.status === 'done').length

        setStats({
          totalProjects: allProjects.length,
          activeSprints,
          tasksTodo,
          tasksCompleted,
        })

        // 6. Recent tasks: sort by createdAt desc, take 5
        const sorted = [...allTasks].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
        setRecentTasks(sorted.slice(0, 5))
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        } else {
          setError('Failed to load dashboard data. Please refresh the page.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  // ── Task click handler ─────────────────────────────────────────────────────
  const handleTaskClick = (task) => {
    setSelectedTask({
      title: task.title,
      description: task.description || 'No description provided.',
      status: getStatusLabel(task.status),
      priority: task.priority || 'medium',
      assignee: task.assignee?.fullName ?? task.assigneeId ?? '—',
      reporter: task.createdBy?.fullName ?? task.createdById ?? '—',
      sprint: task.sprint?.name ?? task.sprintId ?? '—',
      points: task.storyPoints ?? '—',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—',
      created: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—',
    })
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5e6ad2' }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div
            className="p-4 rounded-md border text-center"
            style={{
              backgroundColor: '#fee2e2',
              borderColor: '#fecaca',
              color: '#dc2626',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const firstName = user.fullName?.split(' ')[0] || user.email || 'there'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Dashboard" />

      <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>
        {/* Greeting */}
        <p className="mb-6" style={{ fontSize: '14px', color: '#6b7280' }}>
          {getGreeting()}, {firstName}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={FolderKanban}
            color="#5e6ad2"
          />
          <StatCard
            title="Active Sprints"
            value={stats.activeSprints}
            icon={Zap}
            color="#ca8a04"
          />
          <StatCard
            title="Tasks To Do"
            value={stats.tasksTodo}
            icon={Clock}
            color="#dc2626"
          />
          <StatCard
            title="Tasks Completed"
            value={stats.tasksCompleted}
            icon={CheckCircle2}
            color="#16a34a"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-5 gap-6">
          {/* Left — Recent Tasks (60%) */}
          <div className="col-span-3">
            <h2
              className="font-bold mb-4"
              style={{ fontSize: '16px', color: '#111827' }}
            >
              My Recent Tasks
            </h2>

            {recentTasks.length === 0 ? (
              <div
                className="bg-white border rounded-md p-12 text-center"
                style={{ borderColor: '#e5e7eb' }}
              >
                <CheckCircle2
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: '#9ca3af' }}
                />
                <h3
                  className="font-semibold mb-2"
                  style={{ fontSize: '16px', color: '#111827' }}
                >
                  No recent tasks
                </h3>
                <p className="mb-4" style={{ fontSize: '14px', color: '#6b7280' }}>
                  Tasks you're working on will appear here
                </p>
                <button
                  onClick={() => navigate('/app/my-tasks')}
                  className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: '#5e6ad2',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  View All Tasks
                </button>
              </div>
            ) : (
              <div
                className="bg-white border rounded-md overflow-hidden"
                style={{ borderColor: '#e5e7eb' }}
              >
                {recentTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right — My Teams (40%) */}
          <div className="col-span-2">
            <h2
              className="font-bold mb-4"
              style={{ fontSize: '16px', color: '#111827' }}
            >
              My Teams
            </h2>

            {teams.length === 0 ? (
              <div
                className="bg-white border rounded-md p-8 text-center"
                style={{ borderColor: '#e5e7eb' }}
              >
                <Users size={40} className="mx-auto mb-3" style={{ color: '#9ca3af' }} />
                <h3
                  className="font-semibold mb-1"
                  style={{ fontSize: '15px', color: '#111827' }}
                >
                  Not in any teams yet
                </h3>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                  Join or create a team to get started
                </p>
              </div>
            ) : (
              <div
                className="bg-white border rounded-md overflow-hidden"
                style={{ borderColor: '#e5e7eb' }}
              >
                {teams.map((team) => (
                  <TeamRow
                    key={team.id}
                    team={team}
                    onViewClick={() => navigate(`/app/teams/${team.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Slide-over */}
      <TaskDetailPanel
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />
    </div>
  )
}