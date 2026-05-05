import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { seminarService } from '../services/seminarService'
import { Seminar } from '../types/seminar'

function SeminarDetail() {
  const { id } = useParams()
  const [seminar, setSeminar] = useState<Seminar | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchSeminar = async () => {
      try {
        const allSeminars = await seminarService.list()
        const found = allSeminars.find((item) => item.id === id)
        if (!found) {
          setErrorMessage('Seminar not found.')
          return
        }
        setSeminar(found)
      } catch (error: any) {
        setErrorMessage(error?.response?.data?.detail || 'Failed to load seminar detail.')
      }
    }

    fetchSeminar()
  }, [id])

  return (
    <AppLayout title="Seminar Detail" subtitle="Detailed seminar view based on legacy template flow.">
      <Link to="/seminars" className="text-sm text-blue-700 hover:underline">
        Back to seminars
      </Link>
      {errorMessage && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {seminar && (
        <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">{seminar.title}</h2>
          <p className="mt-2 text-gray-700">{seminar.description || 'No description provided.'}</p>
          <ul className="mt-4 space-y-1 text-sm text-gray-700">
            <li><strong>When:</strong> {new Date(seminar.scheduled_date).toLocaleString()}</li>
            <li><strong>Duration:</strong> {seminar.duration_minutes || 90} minutes</li>
            <li><strong>Location:</strong> {seminar.location || 'TBA'}</li>
            <li><strong>Status:</strong> {seminar.status || 'scheduled'}</li>
          </ul>
          {seminar.meeting_link && (
            <a
              className="mt-4 inline-block rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              href={seminar.meeting_link}
              target="_blank"
              rel="noreferrer"
            >
              Join Meeting
            </a>
          )}
        </div>
      )}
    </AppLayout>
  )
}

export default SeminarDetail
