import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import api from '../services/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);

  const navigate = useNavigate();
  const fullNameInputRef = useRef(null);

  // Auto-focus the first field when the page loads
  useEffect(() => {
    fullNameInputRef.current?.focus();
  }, []);

  // --- Validation helpers ---

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePasswordStrength = (value) => {
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    return hasLetter && hasNumber;
  };

  const validateAllFields = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!validatePasswordStrength(password)) {
      newErrors.password = 'Password must contain letters and numbers';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  // --- Form submit ---

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run client-side validation first
    const validationErrors = validateAllFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setGlobalError(null);
    setErrors({});

    try {
      // Why api.post and not fetch?
      // api.js is your axios instance. It handles the /api base URL
      // and attaches the JWT on every request. Always use it.
      const response = await api.post('/auth/register', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Why response.data.data.token and not response.data.token?
      // Your backend wraps all responses: { success, message, data: { token, user } }
      // axios adds another .data layer on top, so the path is:
      // response (axios) → .data (HTTP body) → .data (your envelope) → .token
      const token = response.data.data.token;
      const user = response.data.data.user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/app/dashboard', { replace: true });

    } catch (err) {
      // axios throws on non-2xx responses, so we catch here
      const data = err.response?.data;
      const status = err.response?.status;

      if (status === 400 && data?.errors) {
        // Zod field-level errors from your global error handler
        // Shape: { errors: [{ path, message }] }
        // Map them to your errors state object
        const fieldErrors = {};
        data.errors.forEach((error) => {
          if (error.path) fieldErrors[error.path] = error.message;
        });
        setErrors(fieldErrors);
        return;
      }

      if (status === 409) {
        setErrors({ email: 'This email is already registered' });
        return;
      }

      if (status === 429) {
        setGlobalError('Too many attempts. Please try again in 15 minutes.');
        return;
      }

      setGlobalError(data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel: dark branding ── */}
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
          {[
            'Scrum-based project management',
            'Real-time collaboration for teams',
            'Built for engineering excellence',
          ].map((text) => (
            <div key={text} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#5e6ad2' }}
              >
                <Check size={14} className="text-white" />
              </div>
              <span className="text-white" style={{ fontSize: '15px' }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="w-1/2 bg-white flex items-center justify-center px-16">
        <div className="w-full max-w-md">

          <h2 className="font-bold mb-8" style={{ fontSize: '28px', color: '#111827' }}>
            Create Account
          </h2>

          {/* Global error banner — shown for server errors */}
          {globalError && (
            <div
              className="p-3 mb-4 rounded-md border"
              role="alert"
              style={{ backgroundColor: '#fee2e2', borderColor: '#fecaca', color: '#dc2626' }}
            >
              <p style={{ fontSize: '14px' }}>{globalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Full Name
              </label>
              <input
                ref={fullNameInputRef}
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                disabled={isLoading}
                aria-invalid={errors.fullName ? 'true' : 'false'}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{
                  fontSize: '14px',
                  height: '36px',
                  backgroundColor: 'white',
                  borderColor: errors.fullName ? '#dc2626' : '#e5e7eb',
                }}
                placeholder="John Doe"
                autoComplete="name"
              />
              {errors.fullName && (
                <p
                  id="fullName-error"
                  className="mt-1"
                  role="alert"
                  style={{ fontSize: '13px', color: '#dc2626' }}
                >
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                disabled={isLoading}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{
                  fontSize: '14px',
                  height: '36px',
                  backgroundColor: 'white',
                  borderColor: errors.email ? '#dc2626' : '#e5e7eb',
                }}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1"
                  role="alert"
                  style={{ fontSize: '13px', color: '#dc2626' }}
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                disabled={isLoading}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{
                  fontSize: '14px',
                  height: '36px',
                  backgroundColor: 'white',
                  borderColor: errors.password ? '#dc2626' : '#e5e7eb',
                }}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.password ? (
                <p
                  id="password-error"
                  className="mt-1"
                  role="alert"
                  style={{ fontSize: '13px', color: '#dc2626' }}
                >
                  {errors.password}
                </p>
              ) : (
                <p id="password-hint" className="mt-1" style={{ fontSize: '12px', color: '#6b7280' }}>
                  At least 8 characters with letters and numbers
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1.5 font-medium"
                style={{ fontSize: '14px', color: '#111827' }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                disabled={isLoading}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                className="w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{
                  fontSize: '14px',
                  height: '36px',
                  backgroundColor: 'white',
                  borderColor: errors.confirmPassword ? '#dc2626' : '#e5e7eb',
                }}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="mt-1"
                  role="alert"
                  style={{ fontSize: '13px', color: '#dc2626' }}
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-center px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#5e6ad2',
                color: 'white',
                fontSize: '14px',
                marginTop: '24px',
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6" style={{ fontSize: '14px', color: '#6b7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#5e6ad2', fontWeight: 500 }}>
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}