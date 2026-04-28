import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Seminars from './pages/Seminars'
import SeminarDetail from './pages/SeminarDetail'
import ScheduleSeminar from './pages/ScheduleSeminar'
import Availability from './pages/Availability'
import SubmitReport from './pages/SubmitReport'
import SubmitFeedback from './pages/SubmitFeedback'
import Profile from './pages/Profile'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
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
              <ScheduleSeminar />
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
              <Availability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/submit"
          element={
            <ProtectedRoute>
              <SubmitReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback/submit"
          element={
            <ProtectedRoute>
              <SubmitFeedback />
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
