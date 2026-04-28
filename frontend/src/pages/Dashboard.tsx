import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useAuthStore } from '../store/authStore'

function Dashboard() {
  const { user } = useAuthStore()

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Overview inspired by the legacy template dashboard."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Welcome</h2>
          <p className="mt-2 text-sm text-gray-700">
            Signed in as {user ? `${user.first_name} ${user.last_name}` : 'User'}.
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="rounded bg-blue-600 px-3 py-2 text-sm text-white" to="/seminars">
              View Seminars
            </Link>
            <Link
              className="rounded bg-green-600 px-3 py-2 text-sm text-white"
              to="/seminars/schedule"
            >
              Schedule Seminar
            </Link>
            <Link className="rounded bg-purple-600 px-3 py-2 text-sm text-white" to="/profile">
              Open Profile
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
