import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { authService } from '../services/authService'
import { User } from '../types/user'

function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authService.getCurrentUser()
        setUser(profile)
      } catch (error: any) {
        setErrorMessage(error?.response?.data?.detail || 'Failed to load profile.')
      }
    }
    fetchProfile()
  }, [])

  return (
    <AppLayout title="Profile" subtitle="User profile equivalent of the legacy template page.">
      {errorMessage && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {user && (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Department:</strong> {user.department || 'N/A'}</p>
            <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
            <p><strong>Status:</strong> {user.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default Profile
