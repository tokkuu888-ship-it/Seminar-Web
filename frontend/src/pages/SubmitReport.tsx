import { useState } from 'react'
import AppLayout from '../components/AppLayout'

function SubmitReport() {
  const [submitted, setSubmitted] = useState(false)
  const [report, setReport] = useState({
    title: '',
    achievements: '',
    challenges: '',
    next_steps: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <AppLayout title="Submit Progress Report" subtitle="Progress report page from legacy template set.">
      <form className="rounded-lg bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        {submitted && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Report saved locally. Connect to API endpoint when available.
          </div>
        )}
        <input
          className="mb-3 w-full rounded border px-3 py-2"
          placeholder="Report title"
          value={report.title}
          onChange={(e) => setReport({ ...report, title: e.target.value })}
          required
        />
        <textarea
          className="mb-3 w-full rounded border px-3 py-2"
          rows={4}
          placeholder="Achievements"
          value={report.achievements}
          onChange={(e) => setReport({ ...report, achievements: e.target.value })}
          required
        />
        <textarea
          className="mb-3 w-full rounded border px-3 py-2"
          rows={4}
          placeholder="Challenges"
          value={report.challenges}
          onChange={(e) => setReport({ ...report, challenges: e.target.value })}
          required
        />
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={4}
          placeholder="Next steps"
          value={report.next_steps}
          onChange={(e) => setReport({ ...report, next_steps: e.target.value })}
          required
        />
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
          Submit Report
        </button>
      </form>
    </AppLayout>
  )
}

export default SubmitReport
