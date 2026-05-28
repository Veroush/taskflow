import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Users, AlertCircle, X } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'

// ─── CreateTeamModal ──────────────────────────────────────────────────────────
// WHY inline: only used on this page for now. When another page needs it,
// we'll extract it to src/components/CreateTeamModal.jsx at that point.

function CreateTeamModal({ isOpen, onClose, onTeamCreated }) {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const nameInputRef = useRef(null)

  // Focus the name input whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      // Small timeout so the DOM has rendered before we focus
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const resetForm = () => {
    setTeamName('')
    setTeamDescription('')
    setFormError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = () => {
    if (!teamName.trim()) return 'Team name is required'
    if (teamName.trim().length < 2) return 'Team name must be at least 2 characters'
    if (teamName.trim().length > 100) return 'Team name must be less than 100 characters'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      // POST /api/teams — response shape: { id, name, description, ownerId, createdAt, ... }
      // WHY api.post and not fetch(): api.js attaches the JWT automatically
      const res = await api.post('/teams', {
        name: teamName.trim(),
        description: teamDescription.trim(),
      })

      // The backend returns the created team object directly (not nested in data/success)
      const newTeam = res.data

      onTeamCreated(newTeam)
      handleClose()
    } catch (err) {
      if (err.response?.status === 401) {
        handleClose()
        // AppLayout will handle the redirect
      } else {
        const message =
          err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          'Failed to create team. Please try again.'
        setFormError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enter key in name input submits the form
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        // Only close if clicking the backdrop itself, not the modal card
        if (e.target === e.currentTarget) handleClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-team-modal-title"
    >
      <div
        className="bg-white rounded-lg w-full"
        style={{ maxWidth: '480px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#e5e7eb' }}
        >
          <h2
            id="create-team-modal-title"
            className="font-bold"
            style={{ fontSize: '18px', color: '#111827' }}
          >
            Create Team
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1 rounded transition-colors hover:bg-gray-100"
          >
            <X size={20} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-4">
          {/* Name field */}
          <div>
            <label
              htmlFor="team-name"
              className="block font-medium mb-1.5"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              ref={nameInputRef}
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value)
                if (formError) setFormError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter team name..."
              aria-required="true"
              aria-invalid={formError ? 'true' : 'false'}
              aria-describedby={formError ? 'team-form-error' : undefined}
              className="w-full px-3 py-2 rounded-md border"
              style={{
                fontSize: '14px',
                height: '36px',
                borderColor: formError ? '#dc2626' : '#e5e7eb',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#5e6ad2')}
              onBlur={(e) =>
                (e.target.style.borderColor = formError ? '#dc2626' : '#e5e7eb')
              }
            />
          </div>

          {/* Description field */}
          <div>
            <label
              htmlFor="team-description"
              className="block font-medium mb-1.5"
              style={{ fontSize: '14px', color: '#111827' }}
            >
              Description
            </label>
            <textarea
              id="team-description"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full px-3 py-2 rounded-md border resize-none"
              style={{
                fontSize: '14px',
                borderColor: '#e5e7eb',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#5e6ad2')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          {/* Form error */}
          {formError && (
            <p
              id="team-form-error"
              role="alert"
              style={{ fontSize: '13px', color: '#dc2626' }}
            >
              {formError}
            </p>
          )}
        </div>

        {/* Modal footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
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
            disabled={isSubmitting || !teamName.trim()}
            className="px-4 py-2 rounded-md font-medium transition-opacity"
            style={{
              fontSize: '14px',
              backgroundColor: '#5e6ad2',
              color: 'white',
              opacity: isSubmitting || !teamName.trim() ? 0.5 : 1,
              cursor: isSubmitting || !teamName.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TeamRow ──────────────────────────────────────────────────────────────────

function TeamRow({ team, isLast, isNew }) {
  // WHY isNew: when a team is just created we flash a brief highlight
  // so the user can clearly see which row was just added to the top.
  const [highlighted, setHighlighted] = useState(isNew)

  useEffect(() => {
    if (isNew) {
      // Remove the highlight after 1.5 seconds
      const timer = setTimeout(() => setHighlighted(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [isNew])

  return (
    <div
      className="flex items-center justify-between px-6 py-4 transition-colors"
      style={{
        borderBottom: isLast ? 'none' : '1px solid #e5e7eb',
        backgroundColor: highlighted ? '#eef0fc' : 'transparent',
        transition: 'background-color 0.8s ease',
      }}
      onMouseEnter={(e) => {
        if (!highlighted) e.currentTarget.style.backgroundColor = '#f9fafb'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = highlighted ? '#eef0fc' : 'transparent'
      }}
      role="article"
      aria-label={`Team: ${team.name}`}
    >
      {/* Left: team info */}
      <div className="flex-1 min-w-0 mr-4">
        <h3 className="font-bold mb-1" style={{ fontSize: '15px', color: '#111827' }}>
          {team.name}
        </h3>
        {team.description ? (
          <p className="truncate mb-1" style={{ fontSize: '13px', color: '#6b7280' }}>
            {team.description}
          </p>
        ) : (
          <p className="mb-1" style={{ fontSize: '13px', color: '#9ca3af' }}>
            No description
          </p>
        )}
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
          {/* memberCount not returned by the API yet — noted as known limitation */}
          {team._count?.members ?? team.memberCount ?? '—'} members
        </p>
      </div>

      {/* Right: view link */}
      <Link
        to={`/app/teams/${team.id}`}
        aria-label={`View ${team.name} details`}
        style={{ fontSize: '13px', color: '#5e6ad2', fontWeight: 500, whiteSpace: 'nowrap' }}
        className="transition-opacity hover:opacity-70"
      >
        View Team →
      </Link>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamsListPage() {
  const navigate = useNavigate()

  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newestTeamId, setNewestTeamId] = useState(null)

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchTeams = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Response shape: { teams: [...] }
      const res = await api.get('/teams')
      setTeams(res.data.teams ?? [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      } else {
        setError('Failed to load teams. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  // ── Team created handler ─────────────────────────────────────────────────────
  // WHY prepend: the new team goes to the top so the user sees it immediately.
  // WHY track newestTeamId: TeamRow uses it to trigger the highlight flash.
  const handleTeamCreated = (newTeam) => {
    setTeams((prev) => [newTeam, ...prev])
    setNewestTeamId(newTeam.id)
    // Clear the "newest" marker after the flash animation finishes
    setTimeout(() => setNewestTeamId(null), 2000)
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Teams" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#5e6ad2' }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading teams...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Teams" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertCircle size={32} style={{ color: '#dc2626' }} />
            </div>
            <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
              Failed to load teams
            </h2>
            <p className="mb-6" style={{ fontSize: '14px', color: '#6b7280' }}>
              {error}
            </p>
            <button
              onClick={fetchTeams}
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

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Teams" />

      <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Manage your teams and collaborate
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new team"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '13px' }}
          >
            <Plus size={16} aria-hidden="true" />
            Create Team
          </button>
        </div>

        {/* Empty state */}
        {teams.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#f9fafb' }}
              >
                <Users size={32} style={{ color: '#9ca3af' }} />
              </div>
              <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#111827' }}>
                No teams yet
              </h2>
              <p className="mb-6" style={{ fontSize: '14px', color: '#6b7280' }}>
                Create your first team to start collaborating with your colleagues
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '14px' }}
              >
                Create Your First Team
              </button>
            </div>
          </div>
        ) : (
          /* Teams list */
          <div
            className="bg-white border rounded-md overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
            aria-label="Teams list"
          >
            {teams.map((team, index) => (
              <TeamRow
                key={team.id}
                team={team}
                isLast={index === teams.length - 1}
                isNew={team.id === newestTeamId}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTeamCreated={handleTeamCreated}
      />
    </div>
  )
}