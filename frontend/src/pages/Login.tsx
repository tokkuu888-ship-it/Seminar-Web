import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

function Login() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [apiReachable, setApiReachable] = useState<boolean | null>(null)
  const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1') as string

  useEffect(() => {
    let cancelled = false

    const checkApi = async () => {
      try {
        // Lightweight probe against auth endpoint.
        await api.get('/auth/me')
        if (!cancelled) setApiReachable(true)
      } catch (error: any) {
        // 401 still means API is reachable (not authenticated yet).
        if (!cancelled) {
          if (error?.response?.status === 401) setApiReachable(true)
          else setApiReachable(false)
        }
      }
    }

    checkApi()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const tokenData = await authService.login(email, password)
      setToken(tokenData.access_token)

      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch {
        // Continue even if profile fetch fails.
      }

      navigate('/dashboard')
    } catch (error: any) {
      if (error?.code === 'ERR_NETWORK') {
        setErrorMessage('Cannot reach backend API. Start backend server and verify VITE_API_URL.')
      } else {
        const detail = error?.response?.data?.detail
        const status = error?.response?.status
        setErrorMessage(detail || `Login failed (${status || 'unknown error'}). Check credentials and backend connection.`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">PhD Seminar Platform</h1>
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
            apiReachable === null
              ? 'border-gray-200 bg-gray-50 text-gray-600'
              : apiReachable
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          API: <span className="font-mono">{apiBaseUrl}</span>
          <span className="ml-2">
            {apiReachable === null ? '(checking...)' : apiReachable ? '(reachable)' : '(unreachable)'}
          </span>
        </div>
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
          <p className="mt-4 text-center text-gray-600">
            New here? <Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
