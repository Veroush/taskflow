import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8f9fb' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}