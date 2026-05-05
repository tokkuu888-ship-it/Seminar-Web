import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { dashboardService } from '../services/dashboardService'
import { workflowService } from '../services/workflowService'
import { useAuthStore } from '../store/authStore'
import { normalizeRoleValue } from '../utils/roles'

type SeminarItem = {
  id: string
  title: string
  scheduled_date: string
  status: string
  location?: string
  meeting_link?: string
}

function DeanDashboard() {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [data, setData] = useState<any>(null)
  const [busySeminarId, setBusySeminarId] = useState<string | null>(null)

  const { user } = useAuthStore()
  const normalizedRole = normalizeRoleValue(user?.role ?? null)
  const isAdmin = normalizedRole === 'ADMIN'

  const [systemLoading, setSystemLoading] = useState(false)
  const [systemError, setSystemError] = useState('')
  const [systemReports, setSystemReports] = useState<any>(null)

  const refresh = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await dashboardService.getDean()
      setData(res.data)
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Failed to load dean dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const refreshSystemReports = async () => {
    setSystemLoading(true)
    setSystemError('')
    try {
      const res = await dashboardService.getSystemReports()
      setSystemReports(res.data)
    } catch (e: any) {
      setSystemError(e?.response?.data?.detail || 'Failed to load system reports.')
    } finally {
      setSystemLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // For DEAN/ADMIN dashboards, pre-load system reports so override decisions are available quickly.
    if (isAdmin) refreshSystemReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const handleDecision = async (seminarId: string, decision: 'APPROVED' | 'REJECTED') => {
    setBusySeminarId(seminarId)
    try {
      await workflowService.approveSeminarSchedule(seminarId, decision)
      await refresh()
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Decision failed.')
    } finally {
      setBusySeminarId(null)
    }
  }

  const handleOverrideToApproved = async (seminarId: string) => {
    setBusySeminarId(seminarId)
    setErrorMessage('')
    try {
      await workflowService.overrideSeminarStatus(seminarId, 'APPROVED', 'Admin-level override')
      await refresh()
      await refreshSystemReports()
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.detail || 'Override failed.')
    } finally {
      setBusySeminarId(null)
    }
  }

  const pending = data?.pending_schedule_approvals?.items as SeminarItem[] | undefined
  const pendingCount = data?.pending_schedule_approvals?.count ?? 0

  return (
    <AppLayout title="Dean Dashboard" subtitle="Governance, oversight, and approvals.">
      {errorMessage && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
      {systemError && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{systemError}</div>}
      {loading ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">Loading…</div>
      ) : (
        <>
          <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">📊 System-wide Reports</h2>
              <button
                className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={refreshSystemReports}
                disabled={systemLoading}
              >
                {systemLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded border border-gray-100 p-3">
                <div className="text-xs text-gray-600">Seminars total</div>
                <div className="mt-1 text-lg font-semibold">{systemReports?.seminars_total ?? 0}</div>
              </div>
              <div className="rounded border border-gray-100 p-3">
                <div className="text-xs text-gray-600">Open polls</div>
                <div className="mt-1 text-lg font-semibold">{systemReports?.availability_polls_open ?? 0}</div>
              </div>
              <div className="rounded border border-gray-100 p-3">
                <div className="text-xs text-gray-600">Progress reports</div>
                <div className="mt-1 text-lg font-semibold">{systemReports?.progress_reports_total ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">📅 Pending Schedule Approvals</h2>
                <span className={`rounded px-2 py-1 text-xs ${pendingCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {pendingCount > 0 ? 'Urgent' : 'Clear'}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{pendingCount} seminar(s) require your decision.</p>

              <div className="mt-4 space-y-3">
                {(pending ?? []).map((s) => (
                  <div key={s.id} className="rounded border border-gray-100 p-3">
                    <div className="font-medium text-gray-900">{s.title}</div>
                    <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                        disabled={busySeminarId === s.id}
                        onClick={() => handleDecision(s.id, 'APPROVED')}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        disabled={busySeminarId === s.id}
                        onClick={() => handleDecision(s.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingCount === 0 && <div className="text-sm text-gray-600">No pending approvals right now.</div>}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">📊 Overall PhD Progress Summary</h2>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div>
                  Progress reports submitted:{' '}
                  <span className="font-semibold">{data?.overall_phd_progress_summary?.progress_reports_submitted ?? 0}</span>
                </div>
                <div>
                  Presenter-seminars total:{' '}
                  <span className="font-semibold">{data?.overall_phd_progress_summary?.presenter_seminars_total ?? 0}</span>
                </div>
              </div>
              <div className="mt-4">
                <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700" onClick={refresh}>
                  Refresh Summary
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">⚠️ At-Risk Students</h2>
            <p className="mt-2 text-sm text-gray-700">
              {data?.at_risk_students?.count ?? 0} student(s) appear to be missing required progress reports.
            </p>
            <div className="mt-3 space-y-2">
              {(data?.at_risk_students?.items ?? []).map((s: SeminarItem) => (
                <div key={s.id} className="rounded border border-gray-100 p-3">
                  <div className="font-medium text-gray-900">{s.title}</div>
                  <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>
                </div>
              ))}
              {(data?.at_risk_students?.count ?? 0) === 0 && <div className="text-sm text-gray-600">Nothing flagged.</div>}
            </div>
          </div>

          {isAdmin && (
            <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">🧱 Override Decisions (Admin)</h2>
              <p className="mt-2 text-sm text-gray-700">
                Admin-level override for rejected schedules. This bypasses standard workflow decisions.
              </p>
              <div className="mt-4 space-y-3">
                {(systemReports?.rejected_recent?.items ?? []).length === 0 && (
                  <div className="text-sm text-gray-600">No recent rejected schedules.</div>
                )}
                {(systemReports?.rejected_recent?.items ?? []).map((s: SeminarItem) => (
                  <div key={s.id} className="rounded border border-gray-100 p-3">
                    <div className="font-medium text-gray-900">{s.title}</div>
                    <div className="mt-1 text-xs text-gray-600">{new Date(s.scheduled_date).toLocaleString()}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        className="rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                        disabled={busySeminarId === s.id}
                        onClick={() => handleOverrideToApproved(s.id)}
                      >
                        {busySeminarId === s.id ? 'Overriding…' : 'Override to APPROVED'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}

export default DeanDashboard

