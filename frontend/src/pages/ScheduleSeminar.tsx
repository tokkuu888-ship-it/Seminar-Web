import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { seminarService } from '../services/seminarService'

function ScheduleSeminar() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    duration_minutes: 90,
    location: '',
    meeting_link: '',
    presenter_id: '',
    technical_moderator_id: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await seminarService.create(formData)
      navigate('/dashboard/coordinator')
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.detail || 'Failed to schedule seminar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout title="Schedule Seminar" subtitle="Create a seminar using the backend API.">
      <form className="rounded-lg bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="rounded border px-3 py-2"
            placeholder="Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <input
            className="rounded border px-3 py-2"
            type="datetime-local"
            required
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
          />
          <input
            className="rounded border px-3 py-2"
            type="number"
            min={15}
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
            placeholder="Duration (minutes)"
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="presenter_id (UUID) - PhD student"
            required
            value={formData.presenter_id}
            onChange={(e) => setFormData({ ...formData, presenter_id: e.target.value })}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="technical_moderator_id (UUID) - Junior PhD"
            required
            value={formData.technical_moderator_id}
            onChange={(e) => setFormData({ ...formData, technical_moderator_id: e.target.value })}
          />
        </div>
        <textarea
          className="mt-4 w-full rounded border px-3 py-2"
          rows={4}
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <input
          className="mt-4 w-full rounded border px-3 py-2"
          placeholder="Meeting link"
          value={formData.meeting_link}
          onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Seminar'}
        </button>
      </form>
    </AppLayout>
  )
}

export default ScheduleSeminar
