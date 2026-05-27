import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="text-white bg-gray-900 min-h-screen p-8">Home</div>} />
      <Route path="/login" element={<div className="text-white bg-gray-900 min-h-screen p-8">Login</div>} />
      <Route path="/register" element={<div className="text-white bg-gray-900 min-h-screen p-8">Register</div>} />
      <Route path="/dashboard" element={<div className="text-white bg-gray-900 min-h-screen p-8">Dashboard</div>} />
    </Routes>
  )
}

export default App