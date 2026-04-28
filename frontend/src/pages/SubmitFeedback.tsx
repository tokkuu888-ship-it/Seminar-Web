import { useState } from 'react'
import AppLayout from '../components/AppLayout'

function SubmitFeedback() {
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState({
    seminar_title: '',
    rating: 5,
    comments: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <AppLayout title="Submit Feedback" subtitle="Feedback form matching the legacy template flow.">
      <form className="rounded-lg bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        {submitted && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Feedback captured locally. Wire to API when endpoint is available.
          </div>
        )}
        <input
          className="mb-3 w-full rounded border px-3 py-2"
          placeholder="Seminar title"
          value={feedback.seminar_title}
          onChange={(e) => setFeedback({ ...feedback, seminar_title: e.target.value })}
          required
        />
        <input
          className="mb-3 w-full rounded border px-3 py-2"
          type="number"
          min={1}
          max={10}
          value={feedback.rating}
          onChange={(e) => setFeedback({ ...feedback, rating: Number(e.target.value) })}
          required
        />
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={5}
          placeholder="Comments"
          value={feedback.comments}
          onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
          required
        />
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
          Submit Feedback
        </button>
      </form>
    </AppLayout>
  )
}

export default SubmitFeedback
