import { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

interface AppLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/seminars', label: 'Seminars' },
  { to: '/seminars/schedule', label: 'Schedule' },
  { to: '/availability', label: 'Availability' },
  { to: '/reports/submit', label: 'Submit Report' },
  { to: '/feedback/submit', label: 'Submit Feedback' },
  { to: '/profile', label: 'Profile' },
]

function AppLayout({ title, subtitle, children }: AppLayoutProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await authService.logout()
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/dashboard" className="text-lg font-semibold text-blue-700">
            PhD Seminar Platform
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded px-2 py-1 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  )
}

export default AppLayout
