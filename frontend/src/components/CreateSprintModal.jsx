import { useState, useEffect, useRef } from 'react'
import { X, AlertCircle } from 'lucide-react'
import api from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns today's date as a YYYY-MM-DD string for the date input default value.
const todayISO = () => new Date().toISOString().split('T')[0]

// Returns today + 14 days as a YYYY-MM-DD string for the end date default value.
const twoWeeksISO = () => {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split('T')[0]
}

// ─── CreateSprintModal ────────────────────────────────────────────────────────
// Props:
//   isOpen          {bool}    — controls visibility
//   onClose         {func}    — called on cancel, Escape, backdrop click, post-submit
//   onSprintCreated {func}    — optional — receives the new sprint object on success
//   projectId       {string}  — required — used in the POST endpoint
//   nextSprintNumber {number} — optional — pre-fills name as "Sprint N" when provided

export default function CreateSprintModal({
  isOpen,
  onClose,
  onSprintCreated,
  projectId,
  nextSprintNumber,
}) {
  const nameRef = useRef(null)

  // ── Form state ──────────────────────────────────────────────────────────────
  // WHY a single object: keeps all field updates in one place and makes reset
  // trivial — one setForm call resets everything at once.
  const [form, setForm] = useState({
    name: '',
    goal: '',
    startDate: todayISO(),
    endDate: twoWeeksISO(),
  })

  // ── Error state ─────────────────────────────────────────────────────────────
  // Keys: "name" | "startDate" | "endDate" | "submit"
  const [errors, setErrors] = useState({})

  // ── Loading state ───────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Reset on open ───────────────────────────────────────────────────────────
  // WHY: every time the modal opens it should start fresh — never carry over
  // data or errors from a previous open.
  // WHY nextSprintNumber in deps: if the parent's sprint count changes between
  // opens, the pre-filled name must update accordingly.
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: nextSprintNumber ? `Sprint ${nextSprintNumber}` : '',
        goal: '',
        startDate: todayISO(),
        endDate: twoWeeksISO(),
      })
      setErrors({})
      // WHY 50ms delay: allows the modal transition to complete so the browser
      // can move focus into the now-visible input without being blocked.
      const t = setTimeout(() => nameRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [isOpen, nextSprintNumber])

  // ── Escape key ──────────────────────────────────────────────────────────────
  // WHY: keyboard users expect Escape to dismiss any modal/dialog.
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Updates a single form field without touching the others.
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  // Clears a single error key without touching the others.
  const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: '' }))

  // ── Validation ───────────────────────────────────────────────────────────────
  // WHY run on submit, not on change: showing errors before the user has
  // finished typing is frustrating. We clear errors on change instead (below).
  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Sprint name is required'
    if (!form.startDate) errs.startDate = 'Start date is required'
    if (!form.endDate) {
      errs.endDate = 'End date is required'
    } else if (form.startDate && form.endDate <= form.startDate) {
      // WHY string comparison works: ISO YYYY-MM-DD strings sort lexicographically
      // so "2026-06-11" > "2026-06-01" is true without needing Date objects.
      errs.endDate = 'End date must be after start date'
    }
    return errs
  }

  // ── Primary button disabled condition ────────────────────────────────────────
  // WHY live (not just on submit): gives the user instant feedback that the
  // form isn't ready, without showing red error text prematurely.
  const isPrimaryDisabled =
    !form.name.trim() || !form.startDate || !form.endDate || isSubmitting

  // ── Submit handler ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      // WHY focus name on error: the most likely validation failure is a blank
      // name, and returning focus there keeps keyboard users in the right place.
      if (errs.name) nameRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      // Build the request body.
      // WHY convert dates: the backend expects full ISO datetime strings.
      // WHY omit goal when empty: Zod rejects null for string fields — we omit
      // optional fields entirely rather than sending null or empty string.
      const body = {
        name: form.name.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      }
      if (form.goal.trim()) {
        body.goal = form.goal.trim()
      }

      // WHY api instance: the axios interceptor in services/api.js automatically
      // attaches the Authorization: Bearer <token> header — no manual token
      // reading needed here.
      const response = await api.post(`/projects/${projectId}/sprints`, body)

      // WHY response.data.data: the backend wraps all responses in
      // { success: true, data: { ... } } — confirmed via Postman.
      const newSprint = response.data.data

      onSprintCreated?.(newSprint)
      onClose()
    } catch (err) {
      // WHY keep modal open on error: the user should be able to fix the issue
      // and retry without losing their input.
      const serverMessage = err.response?.data?.error
      setErrors({
        submit: serverMessage || 'Failed to create sprint. Please try again.',
      })
    } finally {
      // WHY in finally: isSubmitting must reset even if an error is thrown,
      // otherwise the button stays permanently locked.
      setIsSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!isOpen) return null

  return (
    // Backdrop
    // WHY fixed + inset-0: covers the entire viewport regardless of scroll position.
    // WHY z-50: sits above all page content.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      {/* Dialog */}
      {/* WHY stopPropagation: prevents clicks inside the modal from bubbling up
          to the backdrop and closing the modal unintentionally. */}
      <div
        className="bg-white rounded-lg w-full overflow-hidden"
        style={{ maxWidth: '480px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-sprint-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <h2
            id="create-sprint-modal-title"
            className="font-semibold"
            style={{ fontSize: '18px', color: '#111827' }}
          >
            Create Sprint
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded transition-colors hover:bg-gray-100"
          >
            <X size={18} style={{ color: '#9ca3af' }} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="p-6 space-y-4">

          {/* Submit-level error banner */}
          {errors.submit && (
            <div
              className="p-3 rounded-md border flex items-center gap-2"
              style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
              role="alert"
            >
              <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#dc2626' }}>{errors.submit}</p>
            </div>
          )}

          {/* ── Sprint Name ──────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="sprint-name"
              className="block font-medium"
              style={{ fontSize: '14px', color: '#111827', marginBottom: '6px' }}
            >
              Sprint Name <span style={{ color: '#dc2626' }} aria-hidden="true">*</span>
            </label>
            <input
              ref={nameRef}
              id="sprint-name"
              type="text"
              value={form.name}
              placeholder="e.g. Sprint 2"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'sprint-name-error' : undefined}
              onChange={(e) => {
                setField('name', e.target.value)
                clearError('name')
              }}
              className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
              style={{
                fontSize: '14px',
                height: '36px',
                borderColor: errors.name ? '#dc2626' : '#e5e7eb',
                // WHY inline focus ring color: Tailwind v4 uses CSS variables for
                // focus:ring-[color] — easier to keep consistent with the project's
                // primary color via inline style override.
                '--tw-ring-color': 'rgba(94, 106, 210, 0.2)',
              }}
            />
            {errors.name && (
              <p
                id="sprint-name-error"
                role="alert"
                style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* ── Sprint Goal (optional) ───────────────────────────────────────── */}
          <div>
            <label
              htmlFor="sprint-goal"
              className="block font-medium"
              style={{ fontSize: '14px', color: '#111827', marginBottom: '6px' }}
            >
              Sprint Goal
              <span className="ml-1 font-normal" style={{ color: '#9ca3af' }}>
                (optional)
              </span>
            </label>
            <textarea
              id="sprint-goal"
              rows={3}
              value={form.goal}
              placeholder="What is the team trying to achieve in this sprint?"
              onChange={(e) => setField('goal', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 resize-none"
              style={{
                fontSize: '14px',
                '--tw-ring-color': 'rgba(94, 106, 210, 0.2)',
              }}
            />
          </div>

          {/* ── Date pair ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">

            {/* Start Date */}
            <div>
              <label
                htmlFor="sprint-start"
                className="block font-medium"
                style={{ fontSize: '14px', color: '#111827', marginBottom: '6px' }}
              >
                Start Date <span style={{ color: '#dc2626' }} aria-hidden="true">*</span>
              </label>
              <input
                id="sprint-start"
                type="date"
                value={form.startDate}
                aria-required="true"
                aria-invalid={!!errors.startDate}
                aria-describedby={errors.startDate ? 'sprint-start-error' : undefined}
                onChange={(e) => {
                  setField('startDate', e.target.value)
                  // WHY clear both: changing start date may fix the cross-field
                  // "end must be after start" error on the end date field.
                  clearError('startDate')
                  clearError('endDate')
                }}
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
                style={{
                  fontSize: '14px',
                  height: '36px',
                  borderColor: errors.startDate ? '#dc2626' : '#e5e7eb',
                  '--tw-ring-color': 'rgba(94, 106, 210, 0.2)',
                }}
              />
              {errors.startDate && (
                <p
                  id="sprint-start-error"
                  role="alert"
                  style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}
                >
                  {errors.startDate}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="sprint-end"
                className="block font-medium"
                style={{ fontSize: '14px', color: '#111827', marginBottom: '6px' }}
              >
                End Date <span style={{ color: '#dc2626' }} aria-hidden="true">*</span>
              </label>
              <input
                id="sprint-end"
                type="date"
                value={form.endDate}
                aria-required="true"
                aria-invalid={!!errors.endDate}
                aria-describedby={errors.endDate ? 'sprint-end-error' : undefined}
                onChange={(e) => {
                  setField('endDate', e.target.value)
                  clearError('endDate')
                }}
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2"
                style={{
                  fontSize: '14px',
                  height: '36px',
                  borderColor: errors.endDate ? '#dc2626' : '#e5e7eb',
                  '--tw-ring-color': 'rgba(94, 106, 210, 0.2)',
                }}
              />
              {errors.endDate && (
                <p
                  id="sprint-end-error"
                  role="alert"
                  style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}
                >
                  {errors.endDate}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #e5e7eb' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md font-medium transition-colors hover:bg-gray-50"
            style={{ fontSize: '14px', color: '#6b7280' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPrimaryDisabled}
            className="px-4 py-2 rounded-md font-medium transition-opacity"
            style={{
              fontSize: '14px',
              color: 'white',
              backgroundColor: isPrimaryDisabled ? '#9ca3af' : '#5e6ad2',
              cursor: isPrimaryDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Create Sprint'}
          </button>
        </div>
      </div>
    </div>
  )
}