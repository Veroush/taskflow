import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route path="dashboard" element={<div className="p-8">Dashboard coming soon</div>} />
        <Route path="my-tasks" element={<div className="p-8">My Tasks coming soon</div>} />
        <Route path="teams" element={<div className="p-8">Teams coming soon</div>} />
        <Route path="projects" element={<div className="p-8">Projects coming soon</div>} />
        <Route path="settings" element={<div className="p-8">Settings coming soon</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App