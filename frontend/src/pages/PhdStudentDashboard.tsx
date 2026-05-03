import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { dashboardService } from '../services/dashboardService'
import { workflowService } from '../services/workflowService'

type SeminarItem = {
  id: string
  title: string
  scheduled_date: string
  status: string
  location?: string
}

type ProgressTimelineItem = {
  id: string
  seminar_id: string
  title: string | null
  achievements: string | null
  challenges: string | null
  next_steps: string | null
  submitted_at: string
}

type FeedbackItem = {
  id: string
  seminar_id: string
  faculty_id: string
  rating: number | null
  positive: string | null
  corrective: string | null
  comments: string | null
  created_at: string
}

function PhdStudentDashboard() {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [data, setData] = useState<any>(null)

  const [busySeminarId, setBusySeminarId] = useState<string | null>(null)

  const [reportFormBySeminar, setReportFormBySeminar] = useState<
    Record<string, { title: string; achievements: string; challenges: string; next_steps: string }>
  >({})

  const [presentationFileBySeminar, setPresentationFileBySeminar] = useState<Record<string, string>>({})
  const [presentationNotesBySeminar, setPresentationNotesBySeminar] = useState<Record<string, string>>({})

  const refresh = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await dashboardService.getStudent()
      setData(res.data)
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Failed to load student dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const upcoming = (data?.my_upcoming_seminar?.items ?? []) as SeminarItem[]
  const timeline = (data?.progress_timeline?.items ?? []) as ProgressTimelineItem[]
  const feedbacks = (data?.feedback_received?.items ?? []) as FeedbackItem[]

  const submitReport = async (seminarId: string) => {
    const form = reportFormBySeminar[seminarId] ?? { title: '', achievements: '', challenges: '', next_steps: '' }
    if (!form.achievements.trim() || !form.challenges.trim() || !form.next_steps.trim()) {
      setErrorMessage('Achievements, challenges, and next steps are required.')
      return
    }
    setBusySeminarId(seminarId)
    setErrorMessage('')
    try {
      await workflowService.submitProgressReport(seminarId, {
        title: form.title,
        achievements: form.achievements,
        challenges: form.challenges,
        next_steps: form.next_steps,
      })
      await refresh()
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Progress report submission failed.')
    } finally {
      setBusySeminarId(null)
    }
  }

  const preparePresentation = async (seminarId: string) => {
    const file_url = presentationFileBySeminar[seminarId] ?? ''
    const notes = presentationNotesBySeminar[seminarId] ?? ''
    if (!file_url.trim()) {
      setErrorMessage('file_url is required for presentation readiness.')
      return
    }

    setBusySeminarId(seminarId)
    setErrorMessage('')
    try {
      await workflowService.markPresentationReady(seminarId, file_url.trim(), notes)
      await refresh()
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Failed to mark presentation readiness.')
    } finally {
      setBusySeminarId(null)
    }
  }

  return (
    <AppLayout title="PhD Student Dashboard" subtitle="Progress tracking, preparation for mock defense, and feedback review.">
      {errorMessage && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
      {loading ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">📅 My Upcoming Seminar</h2>
              <p className="mt-2 text-sm text-gray-700">Submit your one-page progress report beforehand so the viva can start quickly.</p>
              <div className="mt-4 space-y-3">
                {upcoming.length === 0 && <div className="text-sm text-gray-600">No upcoming seminars assigned to you.</div>}
                {upcoming.map((s) => (
                  <div key={s.id} className="rounded border border-gray-100 p-3">
                    <div className="font-medium text-gray-900">{s.title}</div>
                    <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600">Report title</label>
                      <input
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        value={reportFormBySeminar[s.id]?.title ?? ''}
                        onChange={(e) =>
                          setReportFormBySeminar((prev) => ({
                            ...prev,
                            [s.id]: { ...(prev[s.id] ?? { title: '', achievements: '', challenges: '', next_steps: '' }), title: e.target.value },
                          }))
                        }
                        placeholder="e.g. Chapter 3 update"
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600">Achievements</label>
                      <textarea
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        rows={3}
                        value={reportFormBySeminar[s.id]?.achievements ?? ''}
                        onChange={(e) =>
                          setReportFormBySeminar((prev) => ({
                            ...prev,
                            [s.id]: { ...(prev[s.id] ?? { title: '', achievements: '', challenges: '', next_steps: '' }), achievements: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600">Challenges</label>
                      <textarea
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        rows={3}
                        value={reportFormBySeminar[s.id]?.challenges ?? ''}
                        onChange={(e) =>
                          setReportFormBySeminar((prev) => ({
                            ...prev,
                            [s.id]: { ...(prev[s.id] ?? { title: '', achievements: '', challenges: '', next_steps: '' }), challenges: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600">Next steps</label>
                      <textarea
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        rows={2}
                        value={reportFormBySeminar[s.id]?.next_steps ?? ''}
                        onChange={(e) =>
                          setReportFormBySeminar((prev) => ({
                            ...prev,
                            [s.id]: { ...(prev[s.id] ?? { title: '', achievements: '', challenges: '', next_steps: '' }), next_steps: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                        disabled={busySeminarId === s.id}
                        onClick={() => submitReport(s.id)}
                      >
                        📄 Submit Progress Report
                      </button>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">Prepare Presentation</h3>
                      <p className="mt-1 text-xs text-gray-600">Upload a file_url / short notes to mark readiness.</p>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600">presentation file_url</label>
                        <input
                          className="mt-1 w-full rounded border px-3 py-2 text-sm"
                          placeholder="e.g. https://.../slides.pdf"
                          value={presentationFileBySeminar[s.id] ?? ''}
                          onChange={(e) => setPresentationFileBySeminar((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600">notes</label>
                        <textarea
                          className="mt-1 w-full rounded border px-3 py-2 text-sm"
                          rows={2}
                          placeholder="Anything your coordinator/technical moderator should know?"
                          value={presentationNotesBySeminar[s.id] ?? ''}
                          onChange={(e) => setPresentationNotesBySeminar((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          className="rounded bg-blue-700 px-3 py-2 text-sm text-white hover:bg-blue-800 disabled:opacity-50"
                          disabled={busySeminarId === s.id}
                          onClick={() => preparePresentation(s.id)}
                        >
                          🔐 Mark Presentation Ready
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">🎯 Next Milestones</h2>
              <p className="mt-2 text-sm text-gray-700">Based on your upcoming seminar assignments.</p>
              <div className="mt-4 space-y-3">
                {upcoming.length === 0 ? (
                  <div className="text-sm text-gray-600">No milestones yet.</div>
                ) : (
                  upcoming.map((s) => (
                    <div key={s.id} className="rounded border border-gray-100 p-3">
                      <div className="font-medium text-gray-900">{s.title}</div>
                      <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700" onClick={refresh}>
                  Refresh Dashboard
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">📊 My Progress Timeline</h2>
              <div className="mt-4 space-y-3">
                {timeline.length === 0 && <div className="text-sm text-gray-600">No progress reports submitted yet.</div>}
                {timeline.map((r) => (
                  <div key={r.id} className="rounded border border-gray-100 p-3">
                    <div className="font-medium text-gray-900">{r.title ?? 'Untitled report'}</div>
                    <div className="mt-1 text-xs text-gray-600">Submitted: {new Date(r.submitted_at).toLocaleString()}</div>
                    <div className="mt-2 text-sm text-gray-700">
                      Next steps: {r.next_steps ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">💬 Feedback Received</h2>
              <div className="mt-4 space-y-3">
                {feedbacks.length === 0 && <div className="text-sm text-gray-600">No feedback yet.</div>}
                {feedbacks.map((f) => (
                  <div key={f.id} className="rounded border border-gray-100 p-3">
                    <div className="font-medium text-gray-900">
                      Rating: {f.rating ?? '—'} / 10
                    </div>
                    <div className="mt-1 text-xs text-gray-600">Submitted: {new Date(f.created_at).toLocaleString()}</div>
                    <div className="mt-2 text-sm text-gray-700">
                      <div className="font-medium">Positive</div>
                      <div className="whitespace-pre-wrap text-gray-700">{f.positive ?? '—'}</div>
                      <div className="font-medium mt-2">Corrective</div>
                      <div className="whitespace-pre-wrap text-gray-700">{f.corrective ?? '—'}</div>
                      <div className="font-medium mt-2">Comments</div>
                      <div className="whitespace-pre-wrap text-gray-700">{f.comments ?? '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

export default PhdStudentDashboard

