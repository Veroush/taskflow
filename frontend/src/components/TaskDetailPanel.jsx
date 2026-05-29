import { useState, useEffect, useRef, useCallback } from 'react'
import { X, User, Loader2 } from 'lucide-react'
import api from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// Formats an ISO date string to "May 27, 2026"
const formatDate = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Formats an ISO date string to a relative time string like "2 hours ago"
const formatRelativeTime = (isoString) => {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Maps DB status values (snake_case) → display labels
const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review',  label: 'In Review' },
  { value: 'done',       label: 'Done' },
]

// Maps DB priority values → display labels
const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

// ─── InitialsAvatar ───────────────────────────────────────────────────────────
// WHY extracted: reused for assignee and comment avatars within this component.

function InitialsAvatar({ name, size = 24, fontSize = 11, bgColor = '#5e6ad2' }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        color: 'white',
        fontSize,
      }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  )
}

// ─── SkeletonBlock ────────────────────────────────────────────────────────────

function SkeletonBlock({ width = '100%', height = 16, className = '' }) {
  return (
    <div
      className={`bg-gray-100 rounded animate-pulse ${className}`}
      style={{ width, height }}
    />
  )
}

// ─── TaskDetailPanel ──────────────────────────────────────────────────────────

export default function TaskDetailPanel({ isOpen, onClose, task }) {
  // ── Refs ──────────────────────────────────────────────────────────────────────
  const titleRef       = useRef(null)
  const panelRef       = useRef(null)
  const closeButtonRef = useRef(null)
  const statusRef      = useRef(null)
  const liveRegionRef  = useRef(null)

  // ── Data state ────────────────────────────────────────────────────────────────
  // fullTask: the enriched task fetched from GET /api/tasks/:id on panel open.
  // We keep it separate from the parent's lightweight task object.
  const [fullTask,  setFullTask]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [fetchError, setFetchError] = useState(false)

  // ── Editable field state ──────────────────────────────────────────────────────
  // WHY controlled state: we need to track changes for onBlur auto-save.
  // We initialise from fullTask once it loads.
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [status,      setStatus]      = useState('todo')
  const [priority,    setPriority]    = useState('medium')
  const [storyPoints, setStoryPoints] = useState('')
  const [dueDate,     setDueDate]     = useState('')

  // ── Comments state ────────────────────────────────────────────────────────────
  const [comments,        setComments]        = useState([])
  const [commentInput,    setCommentInput]    = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)

  // ── Subtasks state ────────────────────────────────────────────────────────────
  const [subtasks, setSubtasks] = useState([])

  // ── AI Breakdown state ────────────────────────────────────────────────────────
  const [aiSuggestions,   setAiSuggestions]   = useState([])
  const [aiLoading,       setAiLoading]       = useState(false)
  const [aiError,         setAiError]         = useState(false)
  const [selectedAi,      setSelectedAi]      = useState([]) // indices of checked suggestions

  // ── Announce to screen readers ────────────────────────────────────────────────
  const announce = useCallback((message) => {
    if (liveRegionRef.current) liveRegionRef.current.textContent = message
  }, [])

  // ── Fetch full task on open ───────────────────────────────────────────────────
  // WHY fetch here: the parent passes a lightweight task object. The panel needs
  // the full shape including comments, subtasks, and nested assignee/createdBy.
  useEffect(() => {
    if (!isOpen || !task?.id) return

    const fetchTask = async () => {
      setLoading(true)
      setFetchError(false)
      setFullTask(null)

      try {
        const res = await api.get(`/tasks/${task.id}`)
        const data = res.data.data

        setFullTask(data)

        // Initialise editable fields from real API data
        setTitle(data.title ?? '')
        setDescription(data.description ?? '')
        setStatus(data.status ?? 'todo')
        setPriority(data.priority ?? 'medium')
        setStoryPoints(data.storyPoints ?? '')
        // dueDate from API is ISO string — input[type=date] needs YYYY-MM-DD
        setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : '')
        setComments(data.comments ?? [])
        setSubtasks(data.subtasks ?? [])
      } catch {
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [isOpen, task?.id])

  // ── Scroll panel to top when task changes ────────────────────────────────────
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.scrollTo(0, 0)
    }
  }, [isOpen, task?.id])

  // ── Focus title input when panel opens ───────────────────────────────────────
  useEffect(() => {
    if (isOpen && !loading) {
      // Small delay lets the DOM settle after loading completes
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [isOpen, loading])

  // ── Escape key closes panel ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // ── PATCH helper ──────────────────────────────────────────────────────────────
  // WHY a helper: all field auto-saves share the same pattern.
  const patchTask = useCallback(async (fields) => {
    if (!task?.id) return
    try {
      await api.patch(`/tasks/${task.id}`, fields)
      announce('Changes saved')
    } catch {
      announce('Failed to save changes')
    }
  }, [task?.id, announce])

  // ── Field auto-save handlers ──────────────────────────────────────────────────
  const handleTitleBlur = () => {
    if (title !== fullTask?.title) patchTask({ title })
  }

  const handleDescriptionBlur = () => {
    if (description !== (fullTask?.description ?? '')) patchTask({ description })
  }

  const handleStatusChange = (e) => {
    setStatus(e.target.value)
    patchTask({ status: e.target.value })
  }

  const handlePriorityChange = (e) => {
    setPriority(e.target.value)
    patchTask({ priority: e.target.value })
  }

  const handleStoryPointsBlur = () => {
    const val = storyPoints === '' ? null : Number(storyPoints)
    if (val !== fullTask?.storyPoints) patchTask({ storyPoints: val })
  }

  const handleDueDateChange = (e) => {
    setDueDate(e.target.value)
    patchTask({ dueDate: e.target.value || null })
  }

  // ── Post comment ──────────────────────────────────────────────────────────────
  const handlePostComment = async () => {
    const body = commentInput.trim()
    if (!body || isPostingComment) return

    // Optimistic update: add to top of list immediately
    const optimistic = {
      id: `temp-${Date.now()}`,
      author: {
        name: JSON.parse(localStorage.getItem('user') || '{}')?.fullName ?? 'You',
        initials: getInitials(
          JSON.parse(localStorage.getItem('user') || '{}')?.fullName ?? 'You'
        ),
      },
      body,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    }

    setComments((prev) => [optimistic, ...prev])
    setCommentInput('')
    setIsPostingComment(true)

    try {
      const res = await api.post(`/tasks/${task.id}/comments`, { body })
      const newComment = res.data.data ?? res.data
      // Replace optimistic entry with real comment from server
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? newComment : c))
      )
      announce('Comment posted')
    } catch {
      // Remove optimistic entry on failure and restore input
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id))
      setCommentInput(body)
      announce('Failed to post comment')
    } finally {
      setIsPostingComment(false)
    }
  }

  // ── Subtask toggle ────────────────────────────────────────────────────────────
  const handleSubtaskToggle = async (subtask) => {
    const newCompleted = !subtask.completed

    // Optimistic update
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtask.id ? { ...s, completed: newCompleted } : s))
    )

    try {
      await api.patch(`/tasks/${task.id}/subtasks/${subtask.id}`, { completed: newCompleted })
      announce(`Subtask marked as ${newCompleted ? 'complete' : 'incomplete'}`)
    } catch {
      // Revert on failure
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? { ...s, completed: subtask.completed } : s))
      )
      announce('Failed to update subtask')
    }
  }

  // ── AI breakdown handler ──────────────────────────────────────────────────────
  const handleAiBreakdown = async () => {
    setAiLoading(true)
    setAiError(false)
    setAiSuggestions([])
    setSelectedAi([])
    try {
      const res = await api.post(`/tasks/${task.id}/breakdown`)
      setAiSuggestions(res.data.data)
      setSelectedAi(res.data.data.map((_, i) => i)) // all checked by default
    } catch {
      setAiError(true)
    } finally {
      setAiLoading(false)
    }
  }

  // ── Render guard ──────────────────────────────────────────────────────────────
  if (!isOpen || !task) return null

  // ── Skeleton loading state ────────────────────────────────────────────────────
  const showSkeleton = loading || (!fullTask && !fetchError)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="fixed right-0 top-0 bottom-0 bg-white border-l z-50 overflow-y-auto"
        style={{
          width: '580px',
          borderColor: '#e5e7eb',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 bg-white border-b flex items-center justify-between p-6 z-10"
          style={{ borderColor: '#e5e7eb' }}
        >
          <h2
            id="task-detail-title"
            className="font-bold"
            style={{ fontSize: '18px', color: '#111827' }}
          >
            Task Details
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close task detail panel"
            className="p-1 rounded transition-colors hover:bg-gray-100"
            style={{ color: '#9ca3af' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="p-6">
          {/* ── Fetch error state ──────────────────────────────────────────── */}
          {fetchError && (
            <div className="text-center py-12">
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Failed to load task details.
              </p>
              <button
                onClick={() => {
                  setFetchError(false)
                  setLoading(true)
                  api.get(`/tasks/${task.id}`)
                    .then((res) => {
                      const data = res.data.data
                      setFullTask(data)
                      setTitle(data.title ?? '')
                      setDescription(data.description ?? '')
                      setStatus(data.status ?? 'todo')
                      setPriority(data.priority ?? 'medium')
                      setStoryPoints(data.storyPoints ?? '')
                      setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : '')
                      setComments(data.comments ?? [])
                      setSubtasks(data.subtasks ?? [])
                    })
                    .catch(() => setFetchError(true))
                    .finally(() => setLoading(false))
                }}
                className="mt-3 px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Main content grid ──────────────────────────────────────────── */}
          {!fetchError && (
            <div className="grid grid-cols-5 gap-6">

              {/* ── Left column ─────────────────────────────────────────────── */}
              <div className="col-span-3">

                {/* Title */}
                {showSkeleton ? (
                  <SkeletonBlock width="75%" height={28} className="mb-4" />
                ) : (
                  <input
                    ref={titleRef}
                    type="text"
                    aria-label="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="w-full text-2xl font-bold border-none outline-none mb-4 bg-transparent"
                    style={{ color: '#111827' }}
                  />
                )}

                {/* Status row — status, priority selects */}
                {showSkeleton ? (
                  <div className="flex gap-2 mb-6">
                    <SkeletonBlock width={96} height={34} />
                    <SkeletonBlock width={80} height={34} />
                  </div>
                ) : (
                  <div className="flex gap-2 mb-6 flex-wrap">
                    <select
                      aria-label="Task status"
                      value={status}
                      onChange={handleStatusChange}
                      className="px-3 py-1.5 rounded-md border bg-white text-sm"
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <select
                      aria-label="Task priority"
                      value={priority}
                      onChange={handlePriorityChange}
                      className="px-3 py-1.5 rounded-md border bg-white text-sm"
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <label
                    className="block mb-2 font-medium"
                    style={{ fontSize: '14px', color: '#111827' }}
                  >
                    Description
                  </label>
                  {showSkeleton ? (
                    <SkeletonBlock height={80} />
                  ) : (
                    <textarea
                      aria-label="Task description"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={handleDescriptionBlur}
                      placeholder="Add a description..."
                      className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: '#e5e7eb',
                        fontSize: '14px',
                        resize: 'vertical',
                        focusRingColor: 'rgba(94,106,210,0.2)',
                      }}
                    />
                  )}
                </div>

                {/* Activity & Comments */}
                <div className="border-t pt-6" style={{ borderColor: '#e5e7eb' }}>
                  <h3
                    className="font-semibold mb-4"
                    style={{ fontSize: '16px', color: '#111827' }}
                  >
                    Activity &amp; Comments
                  </h3>

                  {/* Comment list */}
                  {showSkeleton ? (
                    <div className="space-y-3 mb-4">
                      <SkeletonBlock height={64} />
                      <SkeletonBlock height={64} />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="mb-4" style={{ fontSize: '13px', color: '#9ca3af' }}>
                      No comments yet. Be the first to comment.
                    </p>
                  ) : (
                    <div className="space-y-4 mb-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-md p-3"
                          style={{ backgroundColor: '#f9fafb' }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <InitialsAvatar name={comment.author?.name ?? 'User'} />
                            <span
                              className="font-medium"
                              style={{ fontSize: '13px', color: '#111827' }}
                            >
                              {comment.author?.name ?? 'User'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: '14px', color: '#6b7280' }}>{comment.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment input row */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Write a comment"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handlePostComment()
                        }
                      }}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
                      style={{ borderColor: '#e5e7eb', fontSize: '14px' }}
                    />
                    <button
                      onClick={handlePostComment}
                      aria-label="Post comment"
                      disabled={!commentInput.trim() || isPostingComment}
                      className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                      style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
                    >
                      {isPostingComment && <Loader2 size={14} className="animate-spin" />}
                      Post
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Right column ─────────────────────────────────────────────── */}
              <div className="col-span-2">

                {/* Details card */}
                <div
                  className="rounded-md p-4 mb-4"
                  style={{ backgroundColor: '#f9fafb' }}
                >
                  <h3
                    className="font-semibold mb-3"
                    style={{ fontSize: '14px', color: '#111827' }}
                  >
                    Details
                  </h3>

                  {showSkeleton ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <SkeletonBlock key={i} height={16} width={i % 2 === 0 ? '80%' : '60%'} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">

                      {/* Assignee */}
                      <div>
                        <label
                          className="block mb-1"
                          style={{ fontSize: '12px', color: '#9ca3af' }}
                        >
                          Assignee
                        </label>
                        <div className="flex items-center justify-between">
                          {fullTask?.assignee ? (
                            <div className="flex items-center gap-2">
                              <InitialsAvatar name={fullTask.assignee.fullName} />
                              <span style={{ fontSize: '13px', color: '#111827' }}>
                                {fullTask.assignee.fullName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full border flex items-center justify-center"
                                style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
                              >
                                <User size={12} style={{ color: '#9ca3af' }} />
                              </div>
                              <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                                Unassigned
                              </span>
                            </div>
                          )}
                          {/* Change button — stub, will open picker in future */}
                          <button
                            aria-label="Change assignee for this task"
                            style={{ fontSize: '12px', color: '#5e6ad2' }}
                          >
                            {fullTask?.assignee ? 'Change' : 'Assign'}
                          </button>
                        </div>
                      </div>

                      {/* Reporter (createdBy) */}
                      <div>
                        <label
                          className="block mb-1"
                          style={{ fontSize: '12px', color: '#9ca3af' }}
                        >
                          Reporter
                        </label>
                        <div className="flex items-center gap-2">
                          <User size={16} style={{ color: '#9ca3af' }} aria-hidden="true" />
                          <span style={{ fontSize: '13px', color: '#111827' }}>
                            {fullTask?.createdBy?.fullName ?? '—'}
                          </span>
                        </div>
                      </div>

                      {/* Sprint */}
                      <div>
                        <label
                          className="block mb-1"
                          style={{ fontSize: '12px', color: '#9ca3af' }}
                        >
                          Sprint
                        </label>
                        <span
                          style={{
                            fontSize: '13px',
                            color: fullTask?.sprintId ? '#111827' : '#9ca3af',
                          }}
                        >
                          {/* Sprint name not in task response — show ID or "No sprint" */}
                          {fullTask?.sprintId ? `Sprint (${fullTask.sprintId.slice(0, 8)}…)` : 'No sprint'}
                        </span>
                      </div>

                      {/* Story Points */}
                      <div>
                        <label
                          className="block mb-1"
                          style={{ fontSize: '12px', color: '#9ca3af' }}
                        >
                          Story Points
                        </label>
                        <input
                          type="number"
                          aria-label="Story points"
                          min="0"
                          value={storyPoints}
                          onChange={(e) => setStoryPoints(e.target.value)}
                          onBlur={handleStoryPointsBlur}
                          placeholder="—"
                          className="w-full px-2 py-1 rounded border"
                          style={{ borderColor: '#e5e7eb', fontSize: '13px' }}
                        />
                      </div>

                      {/* Due Date */}
                      <div>
                        <label
                          className="block mb-1"
                          style={{ fontSize: '12px', color: '#9ca3af' }}
                        >
                          Due Date
                        </label>
                        <input
                          type="date"
                          aria-label="Due date"
                          value={dueDate}
                          onChange={handleDueDateChange}
                          className="w-full px-2 py-1 rounded border"
                          style={{ borderColor: '#e5e7eb', fontSize: '13px' }}
                        />
                      </div>

                      {/* Created */}
                      <div>
                        <label
                          className="block mb-1"
                          style={{ fontSize: '12px', color: '#9ca3af' }}
                        >
                          Created
                        </label>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          {formatDate(fullTask?.createdAt)}
                        </span>
                      </div>

                    </div>
                  )}
                </div>

                <div>
                  {/* Subtasks section */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold" style={{ fontSize: '14px', color: '#111827' }}>
                      Subtasks
                    </h3>
                    <button
                      onClick={handleAiBreakdown}
                      disabled={aiLoading || showSkeleton}
                      className="flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '12px' }}
                      aria-label="Use AI to suggest subtasks"
                    >
                      {aiLoading
                        ? <><Loader2 size={12} className="animate-spin" /> Thinking...</>
                        : '✨ AI Breakdown'
                      }
                    </button>
                  </div>

                  {/* AI suggestions */}
                  {aiSuggestions.length > 0 && (
                    <div
                      className="rounded-md p-3 mb-3"
                      style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}
                    >
                      <p className="mb-2 font-medium" style={{ fontSize: '12px', color: '#4338ca' }}>
                        AI suggested subtasks — pick the ones you want:
                      </p>
                      <div className="space-y-2 mb-3">
                        {aiSuggestions.map((suggestion, i) => (
                          <label key={i} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedAi.includes(i)}
                              onChange={() =>
                                setSelectedAi((prev) =>
                                  prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                                )
                              }
                              className="w-4 h-4"
                            />
                            <span style={{ fontSize: '13px', color: '#111827' }}>{suggestion}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const chosen = aiSuggestions
                            .filter((_, i) => selectedAi.includes(i))
                            .map((title, i) => ({ id: `ai-${Date.now()}-${i}`, label: title, completed: false }))
                          setSubtasks((prev) => [...prev, ...chosen])
                          setAiSuggestions([])
                          setSelectedAi([])
                        }}
                        disabled={selectedAi.length === 0}
                        className="px-3 py-1 rounded-md font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#4338ca', color: 'white', fontSize: '12px' }}
                      >
                        Add {selectedAi.length} subtask{selectedAi.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  )}

                  {aiError && (
                    <p className="mb-3" style={{ fontSize: '12px', color: '#ef4444' }}>
                      Failed to get AI suggestions. Try again.
                    </p>
                  )}

                  {showSkeleton ? (
                    <div className="space-y-2 mb-3">
                      <SkeletonBlock height={20} width="80%" />
                      <SkeletonBlock height={20} width="60%" />
                    </div>
                  ) : subtasks.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`subtask-${subtask.id}`}
                            aria-label={`Subtask: ${subtask.label}`}
                            checked={subtask.completed}
                            onChange={() => handleSubtaskToggle(subtask)}
                            className="w-4 h-4"
                          />
                          <span
                            style={{
                              fontSize: '13px',
                              color: subtask.completed ? '#6b7280' : '#111827',
                              textDecoration: subtask.completed ? 'line-through' : 'none',
                            }}
                          >
                            {subtask.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Add Subtask — stub */}
                  <button
                    aria-label="Add subtask"
                    style={{ fontSize: '13px', color: '#5e6ad2' }}
                    onClick={() => {}}
                  >
                    + Add Subtask
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Screen reader live region for save confirmations */}
        <div
          ref={liveRegionRef}
          role="status"
          aria-live="polite"
          className="sr-only"
        />
      </div>
    </>
  )
}