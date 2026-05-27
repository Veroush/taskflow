import { Bell, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TopBar({ title }) {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-6 border-b bg-white"
      style={{ height: '52px', borderColor: '#e5e7eb' }}
    >
      <span className="font-bold" style={{ fontSize: '20px', color: '#111827' }}>
        {title}
      </span>

      <div className="flex items-center gap-1">
        <button
          aria-label="Notifications"
          className="p-1.5 rounded transition-colors hover:bg-gray-100"
          style={{ color: '#6b7280' }}
        >
          <Bell size={18} />
        </button>
        <Link
          to="/app/settings"
          aria-label="Settings"
          className="p-1.5 rounded transition-colors hover:bg-gray-100"
          style={{ color: '#6b7280' }}
        >
          <Settings size={18} />
        </Link>
      </div>
    </div>
  )
}