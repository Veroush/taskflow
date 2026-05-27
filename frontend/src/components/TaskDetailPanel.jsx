import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const getPriorityStyle = (priority) => {
  const styles = {
    high: { bg: '#fee2e2', text: '#dc2626' },
    medium: { bg: '#fef9c3', text: '#ca8a04' },
    low: { bg: '#dcfce7', text: '#16a34a' },
  }
  return styles[priority] || styles.medium
}

const getStatusStyle = (status) => {
  const styles = {
    'To Do': { bg: '#f9fafb', text: '#6b7280' },
    'In Progress': { bg: '#ede9fe', text: '#5e6ad2' },
    'In Review': { bg: '#f3e8ff', text: '#9333ea' },
    Done: { bg: '#dcfce7', text: '#16a34a' },
  }
  return styles[status] || styles['To Do']
}

export default function TaskDetailPanel({ isOpen, onClose, task }) {
  const closeButtonRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus close button when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen || !task) return null

  const priorityStyle = getPriorityStyle(task.priority)
  const statusStyle = getStatusStyle(task.status)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Task: ${task.title}`}
        className="fixed top-0 right-0 h-full z-50 bg-white flex flex-col"
        style={{
          width: '420px',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: '#e5e7eb' }}
        >
          <span className="font-bold" style={{ fontSize: '15px', color: '#111827' }}>
            Task Detail
          </span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close task detail"
            className="p-1.5 rounded transition-colors hover:bg-gray-100"
            style={{ color: '#6b7280' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Title */}
          <h2 className="font-semibold" style={{ fontSize: '16px', color: '#111827' }}>
            {task.title}
          </h2>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-full"
              role="status"
              aria-label={`Status: ${task.status}`}
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
                fontSize: '12px',
              }}
            >
              {task.status}
            </span>
            <span
              className="px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: priorityStyle.bg,
                color: priorityStyle.text,
                fontSize: '12px',
              }}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p
                className="mb-1 font-medium"
                style={{ fontSize: '13px', color: '#9ca3af' }}
              >
                Description
              </p>
              <p style={{ fontSize: '14px', color: '#374151' }}>{task.description}</p>
            </div>
          )}

          {/* Meta fields */}
          <div className="flex flex-col gap-3">
            {[
              { label: 'Assignee', value: task.assignee },
              { label: 'Reporter', value: task.reporter },
              { label: 'Sprint', value: task.sprint },
              { label: 'Story Points', value: task.points },
              { label: 'Due Date', value: task.dueDate },
              { label: 'Created', value: task.created },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="shrink-0"
                  style={{ fontSize: '13px', color: '#9ca3af', width: '100px' }}
                >
                  {label}
                </span>
                <span style={{ fontSize: '14px', color: '#111827' }}>{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}