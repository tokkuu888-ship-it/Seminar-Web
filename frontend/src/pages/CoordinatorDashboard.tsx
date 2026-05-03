import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { dashboardService } from '../services/dashboardService'
import { workflowService } from '../services/workflowService'

type SeminarItem = {
  id: string
  title: string
  scheduled_date: string
  status: string
}

function CoordinatorDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [data, setData] = useState<any>(null)
  const [assignBusy, setAssignBusy] = useState<string | null>(null)
  const [facultyIdsBySeminar, setFacultyIdsBySeminar] = useState<Record<string, string>>({})

  const refresh = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await dashboardService.getCoordinator()
      setData(res.data)
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Failed to load coordinator dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openPollId = data?.poll_results_summary?.open_poll_id as string | null
  const responsesCount = data?.poll_results_summary?.responses_count ?? 0
  const pollResponseItems = (data?.poll_results_summary?.items ?? []) as any[]

  const pendingItems = (data?.pending_schedule_approvals?.items ?? []) as SeminarItem[]
  const pendingCount = data?.pending_schedule_approvals?.count ?? 0

  const submittedProgressCount = data?.submitted_progress_reports?.count ?? 0
  const submittedProgressItems = (data?.submitted_progress_reports?.items ?? []) as any[]

  const inviteQueue = (data?.notification_queues?.invite_queue ?? []) as any[]
  const reminderQueue = (data?.notification_queues?.reminder_queue ?? []) as any[]

  const [busyNotification, setBusyNotification] = useState<string | null>(null)

  const handleSendPoll = async () => {
    setErrorMessage('')
    try {
      await workflowService.sendAvailabilityPoll('Please share your availability for upcoming PhD mock defense seminars.')
      await refresh()
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Failed to send availability poll.')
    }
  }

  const handleSendNotification = async (seminarId: string, type: 'INVITE' | 'REMINDER') => {
    setBusyNotification(seminarId)
    setErrorMessage('')
    try {
      await workflowService.sendSeminarNotification(seminarId, type)
      await refresh()
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Notification failed.')
    } finally {
      setBusyNotification(null)
    }
  }

  const handleAssignFaculty = async (seminarId: string) => {
    const raw = facultyIdsBySeminar[seminarId] ?? ''
    const facultyIds = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (!facultyIds.length) {
      setErrorMessage('Enter at least one faculty id (comma-separated).')
      return
    }

    setAssignBusy(seminarId)
    setErrorMessage('')
    try {
      await workflowService.assignFacultyPanel(seminarId, facultyIds)
      await refresh()
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Assigning faculty panel failed.')
    } finally {
      setAssignBusy(null)
    }
  }

  const navCreateScheduleLabel = useMemo(() => (pendingCount > 0 ? 'Create Another Schedule' : 'Create Seminar Schedule'), [pendingCount])

  return (
    <AppLayout title="Coordinator Dashboard" subtitle="Logistics engine: polls, schedules, assignments, and monitoring.">
      {errorMessage && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
      {loading ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">📩 Send Availability Poll</h2>
                <span className={`rounded px-2 py-1 text-xs ${openPollId ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {openPollId ? 'Open' : 'No open poll'}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700">Coordinator sends the monthly check so professors can lock available hours.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700" onClick={handleSendPoll}>
                  Send Poll
                </button>
                {openPollId && (
                  <button className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-300" onClick={refresh}>
                    Refresh Results ({responsesCount})
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">📄 Submitted Progress Reports</h2>
              <p className="mt-2 text-sm text-gray-700">
                {submittedProgressCount} progress report(s) submitted for your seminars.
              </p>
              <div className="mt-4">
                <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700" onClick={refresh}>
                  Refresh Progress
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">👥 Assign Faculty Panel (Workflow)</h2>
              <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{pendingCount} seminar(s) pending</span>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              For each pending schedule, assign the rotating review panel so the dean approval can proceed with evaluation readiness.
            </p>
            <div className="mt-4 space-y-3">
              {pendingItems.length === 0 && <div className="text-sm text-gray-600">No pending seminars to assign.</div>}
              {pendingItems.map((s) => (
                <div key={s.id} className="rounded border border-gray-100 p-3">
                  <div className="font-medium text-gray-900">{s.title}</div>
                  <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>

                  <div className="mt-3">
                    <label className="block text-xs text-gray-600">faculty_ids (comma-separated UUIDs)</label>
                    <input
                      className="mt-1 w-full rounded border px-3 py-2 text-sm"
                      placeholder="e.g. 3f... , 9a..."
                      value={facultyIdsBySeminar[s.id] ?? ''}
                      onChange={(e) => setFacultyIdsBySeminar((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                      disabled={assignBusy === s.id}
                      onClick={() => handleAssignFaculty(s.id)}
                    >
                      {assignBusy === s.id ? 'Assigning…' : 'Assign Panel'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700" onClick={() => navigate('/seminars/schedule')}>
                {navCreateScheduleLabel}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">🗳️ Poll Results Summary</h2>
            <p className="mt-2 text-sm text-gray-700">
              {responsesCount} response(s) recorded for your current open poll.
            </p>
            <div className="mt-4 space-y-2">
              {pollResponseItems.length === 0 && <div className="text-sm text-gray-600">No poll responses yet.</div>}
              {pollResponseItems.map((r: any) => (
                <div key={r.id} className="rounded border border-gray-100 p-3">
                  <div className="text-sm font-medium text-gray-900">Faculty: {r.faculty_id}</div>
                  <div className="mt-1 text-xs text-gray-600">Days: {r.available_days ?? '—'}</div>
                  <div className="mt-1 text-xs text-gray-600">Time: {r.available_time ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">📨 Send Invitations / Reminders</h2>
            <p className="mt-2 text-sm text-gray-700">
              Send INVITE when schedules are approved, and send REMINDER during execution.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded border border-gray-100 p-3">
                <div className="font-medium text-gray-900">INVITE queue</div>
                <div className="mt-1 text-xs text-gray-600">{inviteQueue.length} pending</div>
                <div className="mt-3 space-y-2">
                  {inviteQueue.length === 0 && <div className="text-sm text-gray-600">Nothing to invite.</div>}
                  {inviteQueue.map((s: any) => (
                    <div key={s.id} className="rounded border border-gray-100 p-2">
                      <div className="text-sm font-medium text-gray-900">{s.title}</div>
                      <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>
                      <div className="mt-2">
                        <button
                          className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                          disabled={busyNotification === s.id}
                          onClick={() => handleSendNotification(s.id, 'INVITE')}
                        >
                          {busyNotification === s.id ? 'Sending…' : 'Send Invite'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-gray-100 p-3">
                <div className="font-medium text-gray-900">REMINDER queue</div>
                <div className="mt-1 text-xs text-gray-600">{reminderQueue.length} pending</div>
                <div className="mt-3 space-y-2">
                  {reminderQueue.length === 0 && <div className="text-sm text-gray-600">Nothing to remind.</div>}
                  {reminderQueue.map((s: any) => (
                    <div key={s.id} className="rounded border border-gray-100 p-2">
                      <div className="text-sm font-medium text-gray-900">{s.title}</div>
                      <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>
                      <div className="mt-2">
                        <button
                          className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                          disabled={busyNotification === s.id}
                          onClick={() => handleSendNotification(s.id, 'REMINDER')}
                        >
                          {busyNotification === s.id ? 'Sending…' : 'Send Reminder'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">📄 Submitted Progress Reports (Recent)</h2>
            <div className="mt-4 space-y-2">
              {submittedProgressItems.length === 0 && <div className="text-sm text-gray-600">No submissions yet.</div>}
              {submittedProgressItems.map((r: any) => (
                <div key={r.id} className="rounded border border-gray-100 p-3">
                  <div className="text-sm font-medium text-gray-900">{r.title ?? 'Untitled'}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    Student: {r.student_id} • Submitted: {new Date(r.submitted_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

export default CoordinatorDashboard

