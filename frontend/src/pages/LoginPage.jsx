import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import api from '../services/api'

const features = [
  'Scrum-based project management',
  'Real-time collaboration for teams',
  'Built for engineering excellence',
]

function FeatureBullet({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#5e6ad2' }}
      >
        <Check size={14} color="white" />
      </div>
      <span className="text-white" style={{ fontSize: '15px' }}>
        {text}
      </span>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const emailRef = useRef(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
      const from = location.state?.from?.pathname || '/app/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        setError('Invalid email or password')
      } else if (status === 429) {
        setError('Too many login attempts. Please try again later.')
      } else if (status >= 500) {
        setError('Server error. Please try again later.')
      } else {
        setError(err.response?.data?.message || 'An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* Left Panel */}
      <div
        className="w-1/2 flex flex-col justify-center px-16"
        style={{ backgroundColor: '#0f0f13' }}
      >
        <h1 className="text-white font-bold mb-2" style={{ fontSize: '32px' }}>
          TaskFlow
        </h1>
        <p className="mb-12" style={{ fontSize: '16px', color: '#a78bfa' }}>
          Manage sprints. Ship faster.
        </p>
        <div className="space-y-4">
          {features.map((text) => (
            <FeatureBullet key={text} text={text} />
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 bg-white flex items-center justify-center px-16">
        <div className="w-full max-w-md">
          <h2 className="font-bold mb-8" style={{ fontSize: '28px', color: '#111827' }}>
            Sign In
          </h2>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 mb-4 rounded-md border"
              style={{
                backgroundColor: '#fee2e2',
                borderColor: '#fecaca',
                color: '#dc2626',
              }}
            >
              <p style={{ fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in form">
            <div>
              <label
                htmlFor="email"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Email
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                disabled={isLoading}
                placeholder="you@example.com"
                autoComplete="email"
                required
                aria-required="true"
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{
                  fontSize: '14px',
                  height: '36px',
                  backgroundColor: 'white',
                  borderColor: '#e5e7eb',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                disabled={isLoading}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                aria-required="true"
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{
                  fontSize: '14px',
                  height: '36px',
                  backgroundColor: 'white',
                  borderColor: '#e5e7eb',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-label={isLoading ? 'Signing in...' : 'Sign in'}
              className="w-full text-center px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: '#5e6ad2',
                color: 'white',
                fontSize: '14px',
                marginTop: '24px',
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6" style={{ fontSize: '14px', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#5e6ad2', fontWeight: 500 }}>
              Register
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}