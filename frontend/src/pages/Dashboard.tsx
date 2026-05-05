import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom'
import { normalizeRoleValue, roleToDashboardPath } from '../utils/roles'

function Dashboard() {
  const { user } = useAuthStore()
  const normalizedRole = normalizeRoleValue(user?.role ?? null)
  if (!normalizedRole) {
    return (
      <div className="p-4 text-sm text-gray-600">
        Loading dashboard…
      </div>
    )
  }

  const to = roleToDashboardPath(normalizedRole)
  return <Navigate to={to} replace />
}

export default Dashboard
