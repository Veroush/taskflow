import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MyTasksPage from './pages/MyTasksPage'
import TeamsListPage from './pages/TeamsListPage'
import TeamDetailPage from './pages/TeamDetailPage'
import ProjectBoardPage from './pages/ProjectBoardPage'
import BacklogPage from './pages/BacklogPage'
import SprintsPage from './pages/SprintsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-tasks" element={<MyTasksPage />} />
        <Route path="teams" element={<TeamsListPage />} />
        <Route path="teams/:teamId" element={<TeamDetailPage />} />
        <Route path="teams/:teamId/projects/:projectId/board" element={<ProjectBoardPage />} />
        <Route path="teams/:teamId/projects/:projectId/backlog" element={<BacklogPage />} />
        <Route path="teams/:teamId/projects/:projectId/sprints" element={<SprintsPage />} />
        <Route path="projects" element={<div className="p-8">Projects coming soon</div>} />
        <Route path="settings" element={<div className="p-8">Settings coming soon</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App