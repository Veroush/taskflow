import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  FolderKanban,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/my-tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/app/teams', icon: Users, label: 'Teams' },
  { to: '/app/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div
      className="flex flex-col h-full w-[220px] shrink-0"
      style={{ backgroundColor: '#0f0f13' }}
    >
      {/* Logo */}
      <div className="px-5 py-4 border-b" style={{ borderColor: '#1f1f28' }}>
        <span className="font-bold text-white text-lg">TaskFlow</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-[#5e6ad2] text-white'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f28] hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: '#1f1f28' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#a1a1aa] hover:bg-[#1f1f28] hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  )
}