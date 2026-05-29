import { useState, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import api from '../services/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name:        '',
  description: '',
  status:      'active',
}

const INPUT_BASE =
  'w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 transition-colors'

// ─── CreateProjectModal ───────────────────────────────────────────────────────
// Props:
//   isOpen           boolean   — controls render
//   onClose          function  — called on backdrop, X, Cancel, Escape, and after success
//   onProjectCreated function  — called with (newProject, teamId) on successful POST
//   teamId           string    — when set, hides the team selector and posts to that team
//                               when null/undefined, shows team selector (requires teams prop)
//   teams            array     — [{ id, name }] — required when teamId is not set

export default function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
  teamId,
  teams = [],
}) {
  // ── Form state ────────────────────────────────────────────────────────────────
  const [form,         setForm]         = useState({ ...EMPTY_FORM })
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [errors,       setErrors]       = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const nameRef = useRef(null)

  // ── Reset on open ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setForm({ ...EMPTY_FORM })
    setErrors({})
    setIsSubmitting(false)
    // Pre-select first team when no teamId prop is provided.
    // WHY teams omitted from deps: arrays get a new reference on every render
    // causing an infinite loop. We only need teams[0] at the moment of open.
    if (!teamId) setSelectedTeamId(teams[0]?.id ?? '')
    setTimeout(() => nameRef.current?.focus(), 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, teamId])

  // ── Escape key ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Client-side validation
    if (!form.name.trim()) {
      setErrors({ name: 'Name is required' })
      nameRef.current?.focus()
      return
    }

    // When no teamId prop, require a team selection
    const resolvedTeamId = teamId ?? selectedTeamId
    if (!resolvedTeamId) {
      setErrors({ submit: 'Please select a team.' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // POST /api/projects → { success: true, data: { ...project } }
      const res = await api.post('/projects', {
        name:        form.name.trim(),
        description: form.description.trim() || null,
        status:      form.status,
        teamId:      resolvedTeamId,
      })

      const newProject = res.data.data
      // Pass both the project and the teamId so parents can attach teamName if needed
      onProjectCreated?.(newProject, resolvedTeamId)
      onClose()
    } catch (err) {
      const serverMessage = err.response?.data?.message ?? err.response?.data?.error
      if (err.response?.status === 400) {
        setErrors({ name: serverMessage || 'Name is required' })
        nameRef.current?.focus()
      } else {
        setErrors({ submit: serverMessage || 'Failed to create project. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render guard ──────────────────────────────────────────────────────────────
  if (!isOpen) return null

  const resolvedTeamId = teamId ?? selectedTeamId
  const canSubmit = form.name.trim() && resolvedTeamId && !isSubmitting

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="bg-white rounded-lg w-full flex flex-col"
        style={{ maxWidth: '480px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#e5e7eb' }}
        >
          <h2
            id="create-project-title"
            className="font-bold"
            style={{ fontSize: '18px', color: '#111827' }}
          >
            Create Project
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
        <div className="p-6 space-y-4" style={{ maxHeight: '78vh', overflowY: 'auto' }}>

          {/* Server error banner */}
          {errors.submit && (
            <div
              role="alert"
              className="p-3 rounded-md border flex items-center gap-2"
              style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
            >
              <span style={{ fontSize: '13px', color: '#dc2626' }}>{errors.submit}</span>
            </div>
          )}

          {/* Team selector — only shown when no teamId prop is provided */}
          {!teamId && (
            <div>
              <label
                htmlFor="project-team"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Team
                <span aria-hidden="true" style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
              </label>
              <select
                id="project-team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={isSubmitting}
                className={INPUT_BASE + ' bg-white'}
                style={{ fontSize: '14px', height: '36px', borderColor: '#e5e7eb' }}
              >
                {teams.length === 0 ? (
                  <option value="" disabled>No teams available</option>
                ) : (
                  teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Name — required */}
          <div>
            <label
              htmlFor="project-name"
              className="block mb-1.5 font-medium"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Name
              <span aria-hidden="true" style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
            </label>
            <input
              ref={nameRef}
              id="project-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter project name..."
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'project-name-error' : undefined}
              className={INPUT_BASE}
              style={{
                fontSize: '14px',
                height: '36px',
                borderColor: errors.name ? '#dc2626' : '#e5e7eb',
              }}
            />
            {errors.name && (
              <p
                id="project-name-error"
                role="alert"
                style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Description — optional */}
          <div>
            <label
              htmlFor="project-description"
              className="block mb-1.5 font-medium"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Description
            </label>
            <textarea
              id="project-description"
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              disabled={isSubmitting}
              placeholder="Add a description..."
              className={INPUT_BASE + ' resize-none'}
              style={{ fontSize: '14px', borderColor: '#e5e7eb' }}
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="project-status"
              className="block mb-1.5 font-medium"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Status
            </label>
            <select
              id="project-status"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              disabled={isSubmitting}
              className={INPUT_BASE + ' bg-white'}
              style={{ fontSize: '14px', height: '36px', borderColor: '#e5e7eb' }}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
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
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            aria-busy={isSubmitting}
            className="px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-opacity"
            style={{
              fontSize: '14px',
              backgroundColor: canSubmit ? '#5e6ad2' : '#9ca3af',
              color: 'white',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}