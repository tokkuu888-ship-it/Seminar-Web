import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { normalizeRoleValue } from './utils/roles'
import { Role } from './types/user'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import { useAuthStore } from './store/authStore'
import DeanDashboard from './pages/DeanDashboard'
import CoordinatorDashboard from './pages/CoordinatorDashboard'
import TechnicalModeratorDashboard from './pages/TechnicalModeratorDashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import PhdStudentDashboard from './pages/PhdStudentDashboard'

import Seminars from './pages/Seminars'
import SeminarDetail from './pages/SeminarDetail'
import ScheduleSeminar from './pages/ScheduleSeminar'
import Availability from './pages/Availability'
import SubmitReport from './pages/SubmitReport'
import SubmitFeedback from './pages/SubmitFeedback'
import { authService } from './services/authService'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function RoleProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[]
  children: JSX.Element
}) {
  const user = useAuthStore((state) => state.user)
  const role = normalizeRoleValue(user?.role ?? null)

  if (!role) return <div className="p-4 text-sm text-gray-600">Loading role…</div>
  if (role === 'ADMIN') return children
  if (allowedRoles.includes(role)) return children
  return <Navigate to="/dashboard" replace />
}

function GuestRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  // If we restored a session from localStorage but user profile is missing,
  // fetch it so role-based UI works after refresh.
  useEffect(() => {
    if (!isAuthenticated || !token || user) return
    authService
      .getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => {
        // If the token is invalid, ProtectedRoute will redirect to /login.
      })
  }, [isAuthenticated, token, user, setUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/dean"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['DEAN']}>
                <DeanDashboard />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordinator"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['COORDINATOR']}>
                <CoordinatorDashboard />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/technical-moderator"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['TECHNICAL_MODERATOR']}>
                <TechnicalModeratorDashboard />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/faculty"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['FACULTY']}>
                <FacultyDashboard />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['PHD_CANDIDATE']}>
                <PhdStudentDashboard />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seminars"
          element={
            <ProtectedRoute>
              <Seminars />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seminars/schedule"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['COORDINATOR']}>
                <ScheduleSeminar />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seminars/:id"
          element={
            <ProtectedRoute>
              <SeminarDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['COORDINATOR']}>
                <Availability />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/submit"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['PHD_CANDIDATE']}>
                <SubmitReport />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback/submit"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['FACULTY']}>
                <SubmitFeedback />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
