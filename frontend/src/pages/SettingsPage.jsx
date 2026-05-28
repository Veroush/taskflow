import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, Shield, Sliders, Bell, AlertCircle } from 'lucide-react'
import api from '../services/api'
import TopBar from '../components/TopBar'

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'security',      label: 'Security',      icon: Shield },
  { id: 'preferences',   label: 'Preferences',   icon: Sliders },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

// Shared card wrapper used by every tab
function SettingsCard({ children, danger }) {
  return (
    <div
      className="bg-white rounded-md p-6"
      style={{
        border: danger ? '2px solid #dc2626' : '1px solid #e5e7eb',
      }}
    >
      {children}
    </div>
  )
}

// Shared label
function FieldLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block mb-1.5 font-medium"
      style={{ fontSize: '14px', color: '#111827' }}
    >
      {children}
    </label>
  )
}

// Shared text input
function TextInput({ id, type = 'text', disabled, value, onChange, placeholder }) {
  return (
    <input
      id={id}
      type={type}
      disabled={disabled}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:border-indigo-400 transition-colors"
      style={{
        fontSize: '14px',
        height: '36px',
        backgroundColor: disabled ? '#f9fafb' : 'white',
        color: disabled ? '#9ca3af' : '#111827',
        cursor: disabled ? 'not-allowed' : 'text',
        // focus ring color via inline won't work — handled by Tailwind class above
      }}
    />
  )
}

// Shared primary button
function PrimaryButton({ onClick, children, danger, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90 ${className}`}
      style={{
        backgroundColor: danger ? '#dc2626' : '#5e6ad2',
        color: 'white',
        fontSize: '14px',
      }}
    >
      {children}
    </button>
  )
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────

function ProfileTab({ user }) {
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [jobTitle, setJobTitle] = useState('')
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)

  // Keep fullName in sync if user loads after mount
  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName)
  }, [user?.fullName])

  const handleSave = () => {
    // TODO: wire to PATCH /api/users/me once backend endpoint exists
    // For now, show a brief confirmation so the UI feels real
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initials = getInitials(fullName || user?.fullName)

  return (
    <SettingsCard>
      <h2 className="font-bold mb-6" style={{ fontSize: '18px', color: '#111827' }}>
        Profile
      </h2>

      {/* Avatar row */}
      <div
        className="flex items-center gap-4 pb-6 mb-6"
        style={{ borderBottom: '1px solid #e5e7eb' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#5e6ad2', color: 'white', fontSize: '20px', fontWeight: 600 }}
          role="img"
          aria-label={`Avatar for ${fullName}`}
        >
          {initials}
        </div>
        <button
          onClick={() => {}}
          className="px-4 py-2 rounded-md border transition-colors hover:bg-gray-50"
          style={{ fontSize: '14px', color: '#111827', borderColor: '#e5e7eb' }}
        >
          Change Avatar
        </button>
      </div>

      {/* Form fields */}
      <div className="space-y-6">

        {/* Full Name */}
        <div>
          <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
          <TextInput
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        {/* Email — read-only */}
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <TextInput
            id="email"
            type="email"
            disabled
            value={user?.email ?? ''}
            aria-describedby="email-helper"
          />
          <p id="email-helper" style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Email cannot be changed
          </p>
        </div>

        {/* Job Title */}
        <div>
          <FieldLabel htmlFor="jobTitle">Job Title</FieldLabel>
          <TextInput
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Frontend Engineer"
          />
        </div>

        {/* Bio */}
        <div>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your team a little about yourself"
            className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:border-indigo-400 transition-colors resize-none"
            style={{ fontSize: '14px', color: '#111827' }}
          />
        </div>

        <div className="flex items-center gap-3">
          <PrimaryButton onClick={handleSave}>Save Changes</PrimaryButton>
          {saved && (
            <span style={{ fontSize: '13px', color: '#16a34a' }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </SettingsCard>
  )
}

// ─── SecurityTab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleUpdatePassword = () => {
    setPasswordError('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    // TODO: wire to POST /api/auth/change-password once backend endpoint exists
    setPasswordSaved(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordSaved(false), 2000)
  }

  const handleDeleteAccount = () => {
    // TODO: wire to DELETE /api/users/me once backend endpoint exists
    setShowDeleteConfirm(false)
  }

  return (
    <div className="space-y-6">

      {/* Change Password card */}
      <SettingsCard>
        <h2 className="font-bold mb-6" style={{ fontSize: '18px', color: '#111827' }}>
          Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
            <TextInput
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
            <TextInput
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
            <TextInput
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          {passwordError && (
            <p style={{ fontSize: '13px', color: '#dc2626' }}>{passwordError}</p>
          )}

          <div className="flex items-center gap-3">
            <PrimaryButton onClick={handleUpdatePassword}>Update Password</PrimaryButton>
            {passwordSaved && (
              <span style={{ fontSize: '13px', color: '#16a34a' }}>✓ Password updated</span>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* Danger Zone card */}
      <SettingsCard danger>
        <h2 className="font-bold mb-2" style={{ fontSize: '18px', color: '#dc2626' }}>
          Danger Zone
        </h2>
        <p className="mb-4" style={{ fontSize: '14px', color: '#6b7280' }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <PrimaryButton danger onClick={() => setShowDeleteConfirm(true)}>
            Delete Account
          </PrimaryButton>
        ) : (
          // Inline confirmation — no separate modal needed at this stage
          <div
            className="p-4 rounded-md"
            style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca' }}
          >
            <p className="mb-3 font-medium" style={{ fontSize: '14px', color: '#111827' }}>
              Are you sure? This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <PrimaryButton danger onClick={handleDeleteAccount}>
                Yes, Delete My Account
              </PrimaryButton>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-md border transition-colors hover:bg-gray-50"
                style={{ fontSize: '14px', color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SettingsCard>

    </div>
  )
}

// ─── PreferencesTab ───────────────────────────────────────────────────────────

function PreferencesTab() {
  const [language, setLanguage] = useState('English')
  const [timezone, setTimezone] = useState('UTC')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // TODO: wire to PATCH /api/users/me/preferences once backend endpoint exists
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsCard>
      <h2 className="font-bold mb-6" style={{ fontSize: '18px', color: '#111827' }}>
        Preferences
      </h2>

      <div className="space-y-6">

        {/* Theme */}
        <div>
          <FieldLabel>Theme</FieldLabel>
          <div className="flex gap-3">
            {/* Light — active */}
            <button
              className="px-4 py-2 rounded-md border font-medium transition-colors"
              style={{
                borderColor: '#5e6ad2',
                backgroundColor: '#5e6ad2',
                color: 'white',
                fontSize: '14px',
              }}
            >
              Light
            </button>
            {/* Dark — disabled */}
            <button
              disabled
              className="px-4 py-2 rounded-md border bg-gray-50"
              style={{
                borderColor: '#e5e7eb',
                color: '#9ca3af',
                fontSize: '14px',
                cursor: 'not-allowed',
              }}
            >
              Dark (Coming soon)
            </button>
          </div>
        </div>

        {/* Language */}
        <div>
          <FieldLabel htmlFor="language">Language</FieldLabel>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:border-indigo-400 transition-colors"
            style={{ fontSize: '14px', height: '36px', color: '#111827' }}
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Portuguese</option>
          </select>
        </div>

        {/* Timezone */}
        <div>
          <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:border-indigo-400 transition-colors"
            style={{ fontSize: '14px', height: '36px', color: '#111827' }}
          >
            <option>UTC</option>
            <option>UTC-5 (Eastern Time)</option>
            <option>UTC-6 (Central Time)</option>
            <option>UTC-7 (Mountain Time)</option>
            <option>UTC-8 (Pacific Time)</option>
            <option>UTC+1 (Central European Time)</option>
            <option>UTC+5:30 (India Standard Time)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <PrimaryButton onClick={handleSave}>Save Preferences</PrimaryButton>
          {saved && (
            <span style={{ fontSize: '13px', color: '#16a34a' }}>✓ Saved</span>
          )}
        </div>

      </div>
    </SettingsCard>
  )
}

// ─── NotificationsTab ─────────────────────────────────────────────────────────

// Each toggle is defined here with its label and default value.
// WHY an object keyed by id: makes toggleNotification() a single generic handler
// instead of 5 separate setters.
const NOTIFICATION_ITEMS = [
  { id: 'taskAssigned',      label: 'Task assigned to me',       default: true },
  { id: 'sprintStarted',     label: 'Sprint started',             default: true },
  { id: 'sprintCompleted',   label: 'Sprint completed',           default: false },
  { id: 'taskStatusChanged', label: 'Task status changed',        default: true },
  { id: 'commentOnTask',     label: 'Comment added to my task',   default: true },
]

function NotificationsTab() {
  const [notifications, setNotifications] = useState(() =>
    Object.fromEntries(NOTIFICATION_ITEMS.map((item) => [item.id, item.default]))
  )
  const [saved, setSaved] = useState(false)

  const toggleNotification = (id) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = () => {
    // TODO: wire to PATCH /api/users/me/preferences once backend endpoint exists
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsCard>
      <h2 className="font-bold mb-6" style={{ fontSize: '18px', color: '#111827' }}>
        Notifications
      </h2>

      {/* Toggle list */}
      <div>
        {NOTIFICATION_ITEMS.map((item) => {
          const enabled = notifications[item.id]
          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid #e5e7eb' }}
            >
              <span style={{ fontSize: '14px', color: '#111827' }}>{item.label}</span>

              {/* Toggle switch */}
              <button
                role="switch"
                aria-checked={enabled}
                aria-label={`${item.label} notifications`}
                onClick={() => toggleNotification(item.id)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus:outline-none"
                style={{ backgroundColor: enabled ? '#5e6ad2' : '#e5e7eb' }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{ transform: enabled ? 'translateX(24px)' : 'translateX(4px)' }}
                />
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <PrimaryButton onClick={handleSave}>Save Preferences</PrimaryButton>
        {saved && (
          <span style={{ fontSize: '13px', color: '#16a34a' }}>✓ Saved</span>
        )}
      </div>
    </SettingsCard>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Active tab is driven by ?tab= URL param — defaults to 'profile'
  // WHY URL param: lets users bookmark or share a specific settings tab
  const activeTab = searchParams.get('tab') || 'profile'

  const [user, setUser] = useState(null)
  const [loadError, setLoadError] = useState(false)

  // ── Load user from localStorage ──────────────────────────────────────────────
  // WHY localStorage: GET /api/auth/me would also work but we already store the
  // user object at login. No extra network call needed for name + email display.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
    } catch {
      setLoadError(true)
    }
  }, [])

  const handleTabClick = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  // ── Render active tab content ─────────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case 'profile':       return <ProfileTab user={user} />
      case 'security':      return <SecurityTab />
      case 'preferences':   return <PreferencesTab />
      case 'notifications': return <NotificationsTab />
      default:              return <ProfileTab user={user} />
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Settings" />

      <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#f8f9fb' }}>
        <div className="max-w-4xl">

          {/* Page title */}
          <h1 className="font-bold mb-8" style={{ fontSize: '24px', color: '#111827' }}>
            Settings
          </h1>

          {/* Load error banner */}
          {loadError && (
            <div
              className="flex items-center gap-3 p-4 rounded-md mb-6"
              style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <AlertCircle size={16} style={{ color: '#dc2626', shrink: 0 }} />
              <span style={{ fontSize: '14px', color: '#dc2626' }}>
                Failed to load settings. Please refresh the page.
              </span>
            </div>
          )}

          {/* Two-column layout: left nav + content */}
          <div className="flex gap-8">

            {/* ── Left nav ──────────────────────────────────────────────────── */}
            <nav aria-label="Settings sections" className="w-48 shrink-0">
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeTab === item.id
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: isActive ? '#f9fafb' : 'transparent',
                        color: isActive ? '#111827' : '#6b7280',
                        fontSize: '14px',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      <Icon size={15} aria-hidden="true" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* ── Tab content ───────────────────────────────────────────────── */}
            <div className="flex-1" role="region" aria-label={`${activeTab} settings`}>
              {renderTab()}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}