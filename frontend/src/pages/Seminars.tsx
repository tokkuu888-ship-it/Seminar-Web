import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { seminarService } from '../services/seminarService'
import { Seminar } from '../types/seminar'

function Seminars() {
  const [seminars, setSeminars] = useState<Seminar[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchSeminars = async () => {
      try {
        const data = await seminarService.list()
        setSeminars(data)
      } catch (error: any) {
        setErrorMessage(error?.response?.data?.detail || 'Failed to load seminars.')
      }
    }

    fetchSeminars()
  }, [])

  return (
    <AppLayout title="Seminars" subtitle="All scheduled seminars from the API.">
      <div className="mb-4">
        <Link className="rounded bg-blue-600 px-3 py-2 text-sm text-white" to="/seminars/schedule">
          Schedule New Seminar
        </Link>
      </div>
      {errorMessage && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      <div className="grid gap-4">
        {seminars.map((seminar) => (
          <div key={seminar.id} className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">{seminar.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{seminar.description || 'No description provided.'}</p>
            <p className="mt-2 text-sm text-gray-700">
              {new Date(seminar.scheduled_date).toLocaleString()} - {seminar.location || 'TBA'}
            </p>
            <Link to={`/seminars/${seminar.id}`} className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              View Details
            </Link>
          </div>
        ))}
        {seminars.length === 0 && !errorMessage && (
          <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">No seminars found.</div>
        )}
      </div>
    </AppLayout>
  )
}

export default Seminars
