import { useState, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import api from '../services/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review',  label: 'In Review' },
  { value: 'done',       label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

const EMPTY_FORM = {
  title:       '',
  description: '',
  status:      'todo',
  priority:    'medium',
  assigneeId:  '',
  sprintId:    '',
  storyPoints: '',
  dueDate:     '',
}

// ─── Shared input classes ──────────────────────────────────────────────────────
// WHY inline classes constant: all inputs share the same base style.
// We override borderColor via inline style when there's a validation error.
const INPUT_BASE =
  'w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 transition-colors'

// ─── NewTaskModal ─────────────────────────────────────────────────────────────
// Props:
//   isOpen         boolean   — controls render
//   onClose        function  — called on cancel, backdrop, X, Escape, and after success
//   onTaskCreated  function  — called with the new task object on successful POST
//   projectId      string    — required; the project to create the task in
//   defaultStatus  string    — optional; pre-selects the status dropdown

export default function NewTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  projectId,
  defaultStatus,
}) {
  // ── Form state ────────────────────────────────────────────────────────────────
  const [form,         setForm]         = useState({ ...EMPTY_FORM })
  const [errors,       setErrors]       = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Dropdown data (loaded from API on open) ───────────────────────────────────
  const [members, setMembers] = useState([])   // [{ id, fullName }]
  const [sprints, setSprints] = useState([])   // [{ id, name }]
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const titleRef = useRef(null)

  // ── Reset and load data on open ───────────────────────────────────────────────
  // WHY useEffect on isOpen: we reset the form every time the modal opens so
  // stale data from a previous open never leaks through.
  useEffect(() => {
    if (!isOpen) return

    // Reset form and errors
    setForm({ ...EMPTY_FORM, status: defaultStatus ?? 'todo' })
    setErrors({})
    setIsSubmitting(false)

    // Focus title input after a brief delay to let the DOM settle
    setTimeout(() => titleRef.current?.focus(), 50)

    // Load members and sprints for dropdowns (only if we have a projectId)
    if (!projectId) return

    const loadDropdowns = async () => {
      setLoadingDropdowns(true)
      try {
        const [projectRes, sprintsRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/sprints`),
        ])
        // GET /api/projects/:id returns { success: true, data: { members: [...] } }
        // Each member: { id, projectId, userId, role, joinedAt, user: { id, fullName, email } }
        const projectMembers = projectRes.data.data?.members ?? []
        setMembers(projectMembers.map((m) => ({
          id:       m.user?.id ?? m.userId,
          fullName: m.user?.fullName ?? 'Unknown',
        })))

        // GET /api/projects/:projectId/sprints → { success: true, data: [...] }
        setSprints(sprintsRes.data.data ?? [])
      } catch {
        // Non-fatal — dropdowns just stay empty if this fails
        setMembers([])
        setSprints([])
      } finally {
        setLoadingDropdowns(false)
      }
    }

    loadDropdowns()
  }, [isOpen, projectId, defaultStatus])

  // ── Escape key ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear field-level error as user types
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async () => {
    // Client-side validation
    if (!form.title.trim()) {
      setErrors({ title: 'Title is required' })
      titleRef.current?.focus()
      return
    }

    if (!projectId) {
      setErrors({ submit: 'No project selected. Cannot create task.' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Build body — only include optional fields if they have real values.
      // WHY: the backend Zod schema rejects null for sprintId/storyPoints,
      // and requires full ISO datetime for dueDate, not just YYYY-MM-DD.
      const body = {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        status:      form.status,
        priority:    form.priority,
      }

      if (form.assigneeId)  body.assigneeId  = form.assigneeId
      if (form.sprintId)    body.sprintId    = form.sprintId

      const parsedPoints = parseInt(form.storyPoints, 10)
      if (!isNaN(parsedPoints) && parsedPoints > 0) {
        body.storyPoints = parsedPoints
      }

      if (form.dueDate) {
        // Convert YYYY-MM-DD → full ISO datetime the backend expects
        body.dueDate = new Date(form.dueDate).toISOString()
      }

      // Real endpoint: POST /api/projects/:projectId/tasks
      const res = await api.post(`/projects/${projectId}/tasks`, body)
      const newTask = res.data.data

      // Notify parent to prepend the new task to its list
      onTaskCreated?.(newTask)
      onClose()
    } catch (err) {
      const serverMessage = err.response?.data?.message ?? err.response?.data?.error
      setErrors({
        submit: serverMessage || 'Failed to create task. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render guard ──────────────────────────────────────────────────────────────
  if (!isOpen) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      aria-hidden="true"
    >
      {/* Modal container — stops click propagation so backdrop click doesn't fire inside */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-modal-title"
        className="relative bg-white rounded-lg w-full flex flex-col"
        style={{ maxWidth: '560px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: '#e5e7eb' }}
        >
          <h2
            id="new-task-modal-title"
            className="font-bold"
            style={{ fontSize: '18px', color: '#111827' }}
          >
            Create New Task
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1 rounded transition-colors hover:bg-gray-100"
            style={{ color: '#9ca3af' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{ maxHeight: '78vh' }}
        >
          {/* Server error banner */}
          {errors.submit && (
            <div
              role="alert"
              className="p-3 rounded-md border flex items-center gap-2"
              style={{
                backgroundColor: '#fef2f2',
                borderColor: '#fecaca',
              }}
            >
              <span style={{ fontSize: '13px', color: '#dc2626' }}>{errors.submit}</span>
            </div>
          )}

          {/* Title — required */}
          <div>
            <label
              htmlFor="task-title"
              className="block mb-1.5 font-medium"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Title
              <span aria-hidden="true" style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
            </label>
            <input
              ref={titleRef}
              id="task-title"
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              disabled={isSubmitting}
              placeholder="What needs to be done?"
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'task-title-error' : undefined}
              className={INPUT_BASE}
              style={{
                fontSize: '14px',
                height: '36px',
                borderColor: errors.title ? '#dc2626' : '#e5e7eb',
              }}
            />
            {errors.title && (
              <p
                id="task-title-error"
                role="alert"
                style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}
              >
                {errors.title}
              </p>
            )}
          </div>

          {/* Description — optional */}
          <div>
            <label
              htmlFor="task-description"
              className="block mb-1.5 font-medium"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              disabled={isSubmitting}
              placeholder="Add more details..."
              className={INPUT_BASE}
              style={{ fontSize: '14px', borderColor: '#e5e7eb', resize: 'vertical' }}
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-status"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Status
              </label>
              <select
                id="task-status"
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                disabled={isSubmitting}
                className={INPUT_BASE + ' bg-white'}
                style={{ fontSize: '14px', height: '36px', borderColor: '#e5e7eb' }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                disabled={isSubmitting}
                className={INPUT_BASE + ' bg-white'}
                style={{ fontSize: '14px', height: '36px', borderColor: '#e5e7eb' }}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee + Sprint row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-assignee"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Assignee
              </label>
              <select
                id="task-assignee"
                value={form.assigneeId}
                onChange={(e) => updateField('assigneeId', e.target.value)}
                disabled={isSubmitting || loadingDropdowns}
                className={INPUT_BASE + ' bg-white'}
                style={{ fontSize: '14px', height: '36px', borderColor: '#e5e7eb' }}
              >
                <option value="">
                  {loadingDropdowns ? 'Loading...' : 'Unassigned'}
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-sprint"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Sprint
              </label>
              <select
                id="task-sprint"
                value={form.sprintId}
                onChange={(e) => updateField('sprintId', e.target.value)}
                disabled={isSubmitting || loadingDropdowns}
                className={INPUT_BASE + ' bg-white'}
                style={{ fontSize: '14px', height: '36px', borderColor: '#e5e7eb' }}
              >
                <option value="">
                  {loadingDropdowns ? 'Loading...' : 'None'}
                </option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Story Points + Due Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-points"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Story Points
              </label>
              <input
                id="task-points"
                type="number"
                min="0"
                value={form.storyPoints}
                onChange={(e) => updateField('storyPoints', e.target.value)}
                disabled={isSubmitting}
                placeholder="0"
                aria-label="Story points"
                className={INPUT_BASE}
                style={{ fontSize: '14px', height: '36px', borderColor: '#e5e7eb' }}
              />
            </div>

            <div>
              <label
                htmlFor="task-due-date"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
                disabled={isSubmitting}
                aria-label="Due date"
                className={INPUT_BASE}
                style={{ fontSize: '14px', height: '36px', borderColor: '#e5e7eb' }}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 border-t px-6 py-4 flex items-center justify-end gap-3"
          style={{ borderColor: '#e5e7eb' }}
        >
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md font-medium transition-colors hover:bg-gray-50"
            style={{ fontSize: '14px', color: '#6b7280' }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || isSubmitting}
            aria-disabled={!form.title.trim() || isSubmitting}
            className="px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-opacity"
            style={{
              fontSize: '14px',
              backgroundColor: !form.title.trim() || isSubmitting ? '#9ca3af' : '#5e6ad2',
              color: 'white',
              cursor: !form.title.trim() || isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? 'Saving…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}