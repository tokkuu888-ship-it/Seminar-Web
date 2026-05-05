import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { dashboardService } from '../services/dashboardService'
import { workflowService } from '../services/workflowService'

type SeminarItem = {
  id: string
  title: string
  scheduled_date: string
  status: string
}

type ProgressReportItem = {
  id: string
  seminar_id: string
  student_id: string
  title: string | null
  achievements: string | null
  challenges: string | null
  next_steps: string | null
  submitted_at: string
}

function FacultyDashboard() {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [data, setData] = useState<any>(null)

  const [reportsBySeminar, setReportsBySeminar] = useState<Record<string, ProgressReportItem[]>>({})
  const [busySeminarId, setBusySeminarId] = useState<string | null>(null)

  const [feedbackForm, setFeedbackForm] = useState<Record<string, { rating: number; positive: string; corrective: string; comments: string }>>({})
  const [vivaNotesBySeminar, setVivaNotesBySeminar] = useState<Record<string, string>>({})

  const refresh = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await dashboardService.getFaculty()
      setData(res.data)
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Failed to load faculty dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const assignedSessions = (data?.assigned_sessions?.items ?? []) as SeminarItem[]
  const quickReports = data?.student_progress_reports_quick?.items ?? []

  const loadReports = async (seminarId: string) => {
    setErrorMessage('')
    setBusySeminarId(seminarId)
    try {
      const res = await workflowService.getProgressReports(seminarId)
      setReportsBySeminar((prev) => ({ ...prev, [seminarId]: res.data }))
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Failed to load progress reports.')
    } finally {
      setBusySeminarId(null)
    }
  }

  const submitFeedback = async (seminarId: string) => {
    setErrorMessage('')
    const reports = reportsBySeminar[seminarId] ?? []
    const studentId = reports[0]?.student_id
    if (!studentId) {
      setErrorMessage('Load progress reports first (missing student_id).')
      return
    }
    const form = feedbackForm[seminarId] ?? { rating: 5, positive: '', corrective: '', comments: '' }

    setBusySeminarId(seminarId)
    try {
      await workflowService.submitFeedback(seminarId, {
        student_id: studentId,
        rating: form.rating,
        positive: form.positive,
        corrective: form.corrective,
        comments: form.comments,
      })
      await refresh()
      setReportsBySeminar((prev) => prev)
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Feedback submission failed.')
    } finally {
      setBusySeminarId(null)
    }
  }

  const participateInMockViva = async (seminarId: string) => {
    setErrorMessage('')
    const notes = vivaNotesBySeminar[seminarId] ?? ''
    setBusySeminarId(seminarId)
    try {
      await workflowService.participateInViva(seminarId, notes)
      await refresh()
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Viva participation failed.')
    } finally {
      setBusySeminarId(null)
    }
  }

  return (
    <AppLayout title="Faculty Dashboard" subtitle="Evaluation and feedback: review progress reports, run mock viva, submit structured feedback.">
      {errorMessage && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
      {loading ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">📅 Assigned Sessions</h2>
              <p className="mt-2 text-sm text-gray-700">{assignedSessions.length} seminar(s) assigned to you.</p>
              <div className="mt-4 space-y-3">
                {assignedSessions.length === 0 && <div className="text-sm text-gray-600">No assigned sessions.</div>}
                {assignedSessions.map((s) => (
                  <div key={s.id} className="rounded border border-gray-100 p-3">
                    <div className="font-medium text-gray-900">{s.title}</div>
                    <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                        disabled={busySeminarId === s.id}
                        onClick={() => loadReports(s.id)}
                      >
                        {busySeminarId === s.id ? 'Loading…' : 'View Progress Reports'}
                      </button>
                    </div>
                    {(reportsBySeminar[s.id] ?? []).length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-900">Evaluation Panel Interface</div>
                        <div className="mt-2 text-sm text-gray-700">
                          Student: {reportsBySeminar[s.id][0].student_id}
                        </div>

                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="block text-xs text-gray-600">Rating (1-10)</label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              className="mt-1 w-full rounded border px-3 py-2 text-sm"
                              value={feedbackForm[s.id]?.rating ?? 5}
                              onChange={(e) =>
                                setFeedbackForm((prev) => ({
                                  ...prev,
                                  [s.id]: { ...(prev[s.id] ?? { rating: 5, positive: '', corrective: '', comments: '' }), rating: Number(e.target.value) },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Positive (Sandwich Method)</label>
                            <input
                              className="mt-1 w-full rounded border px-3 py-2 text-sm"
                              value={feedbackForm[s.id]?.positive ?? ''}
                              onChange={(e) =>
                                setFeedbackForm((prev) => ({
                                  ...prev,
                                  [s.id]: { ...(prev[s.id] ?? { rating: 5, positive: '', corrective: '', comments: '' }), positive: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-2">
                          <label className="block text-xs text-gray-600">Corrective feedback</label>
                          <textarea
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            rows={3}
                            value={feedbackForm[s.id]?.corrective ?? ''}
                            onChange={(e) =>
                              setFeedbackForm((prev) => ({
                                ...prev,
                                [s.id]: { ...(prev[s.id] ?? { rating: 5, positive: '', corrective: '', comments: '' }), corrective: e.target.value },
                              }))
                            }
                          />
                        </div>

                        <div className="mt-2">
                          <label className="block text-xs text-gray-600">Final comments</label>
                          <textarea
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            rows={2}
                            value={feedbackForm[s.id]?.comments ?? ''}
                            onChange={(e) =>
                              setFeedbackForm((prev) => ({
                                ...prev,
                                [s.id]: { ...(prev[s.id] ?? { rating: 5, positive: '', corrective: '', comments: '' }), comments: e.target.value },
                              }))
                            }
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                            disabled={busySeminarId === s.id}
                            onClick={() => submitFeedback(s.id)}
                          >
                            📝 Submit Feedback
                          </button>
                          <button className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-300" onClick={() => loadReports(s.id)}>
                            Reload Reports
                          </button>
                        </div>

                        <div className="mt-4">
                          <label className="block text-xs text-gray-600">Mock Viva Participation Notes</label>
                          <textarea
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            rows={3}
                            placeholder="Defense-style questions / guidance for the viva portion."
                            value={vivaNotesBySeminar[s.id] ?? ''}
                            onChange={(e) => setVivaNotesBySeminar((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              className="rounded bg-emerald-700 px-3 py-2 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
                              disabled={busySeminarId === s.id}
                              onClick={() => participateInMockViva(s.id)}
                            >
                              Participate in Mock Viva
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">📄 Student Progress Reports (Quick ≤5 min)</h2>
              <p className="mt-2 text-sm text-gray-700">Recent submissions across your assigned seminars.</p>
              <div className="mt-4 space-y-3">
                {quickReports.length === 0 && <div className="text-sm text-gray-600">No progress reports yet.</div>}
                {quickReports.map((r: any) => (
                  <div key={r.id} className="rounded border border-gray-100 p-3">
                    <div className="text-sm font-medium text-gray-900">{r.title ?? 'Untitled report'}</div>
                    <div className="mt-1 text-xs text-gray-600">Submitted: {new Date(r.submitted_at).toLocaleString()}</div>
                    <div className="mt-1 text-xs text-gray-600">Student: {r.student_id}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700" onClick={refresh}>
                  Refresh Quick View
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

export default FacultyDashboard

