import { useState } from 'react'
import AppLayout from '../components/AppLayout'

function Availability() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    preferred_days: '',
    preferred_time: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <AppLayout title="Availability" subtitle="Set faculty/student availability (template parity page).">
      <form className="rounded-lg bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        {submitted && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Availability captured locally. Hook this to a backend endpoint when ready.
          </div>
        )}
        <input
          className="mb-3 w-full rounded border px-3 py-2"
          placeholder="Preferred days (e.g. Mon, Wed)"
          value={formData.preferred_days}
          onChange={(e) => setFormData({ ...formData, preferred_days: e.target.value })}
          required
        />
        <input
          className="mb-3 w-full rounded border px-3 py-2"
          placeholder="Preferred time (e.g. 2 PM - 5 PM)"
          value={formData.preferred_time}
          onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
          required
        />
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={4}
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
          Save Availability
        </button>
      </form>
    </AppLayout>
  )
}

export default Availability
