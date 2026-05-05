import api from './api'

export const workflowService = {
  // Dean
  approveSeminarSchedule(seminarId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
    return api.post(`/seminars/${seminarId}/approval`, { decision, notes })
  },

  // Coordinator
  assignFacultyPanel(seminarId: string, facultyIds: string[]) {
    return api.post(`/seminars/${seminarId}/assign-faculty`, { faculty_ids: facultyIds })
  },

  // Availability polls
  sendAvailabilityPoll(question?: string) {
    return api.post(`/availability-polls`, { question })
  },
  respondAvailabilityPoll(pollId: string, available_days?: string, available_time?: string, notes?: string) {
    return api.post(`/availability-polls/${pollId}/responses`, {
      available_days,
      available_time,
      notes,
    })
  },
  getAvailabilityPollResponses(pollId: string) {
    return api.get(`/availability-polls/${pollId}/responses`)
  },

  // Technical moderator
  updateMeetingLink(seminarId: string, meetingLink: string, hybrid_status?: string, notes?: string) {
    return api.post(`/seminars/${seminarId}/meeting-link`, {
      meeting_link: meetingLink,
      hybrid_status,
      notes,
    })
  },
  createTechnicalCheck(seminarId: string, data: { latex_compatible: boolean; hybrid_status?: string; meeting_link_valid?: boolean; notes?: string }) {
    return api.post(`/seminars/${seminarId}/technical-check`, data)
  },
  markAttendance(seminarId: string, participantIds: string[], status: 'PRESENT' | 'MISSED') {
    return api.post(`/seminars/${seminarId}/attendance`, { participant_ids: participantIds, status })
  },
  startSession(seminarId: string, meetingLink?: string) {
    return api.post(`/seminars/${seminarId}/start-session`, { meeting_link: meetingLink })
  },
  uploadTechnicalMaterials(seminarId: string, file_url: string) {
    return api.post(`/seminars/${seminarId}/technical-materials`, { file_url })
  },
  reportTechnicalIssue(seminarId: string, issue_type: string, description?: string, resolved?: boolean) {
    return api.post(`/seminars/${seminarId}/technical-issues`, { issue_type, description, resolved })
  },

  // Student
  submitProgressReport(seminarId: string, payload: { title?: string; achievements?: string; challenges?: string; next_steps?: string }) {
    return api.post(`/seminars/${seminarId}/progress-report`, payload)
  },
  markPresentationReady(seminarId: string, file_url?: string, notes?: string) {
    return api.post(`/seminars/${seminarId}/student-preparation`, { file_url, notes })
  },

  // Faculty
  getProgressReports(seminarId: string) {
    return api.get(`/seminars/${seminarId}/progress-reports`)
  },
  submitFeedback(seminarId: string, payload: { student_id: string; rating?: number; positive?: string; corrective?: string; comments?: string }) {
    return api.post(`/seminars/${seminarId}/feedback`, payload)
  },
  participateInViva(seminarId: string, notes?: string) {
    return api.post(`/seminars/${seminarId}/viva-participate`, { notes })
  },

  // Coordinator notifications
  sendSeminarNotification(seminarId: string, notification_type: 'INVITE' | 'REMINDER') {
    return api.post(`/seminars/${seminarId}/notifications`, { notification_type })
  },

  overrideSeminarStatus(seminarId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
    return api.post(`/seminars/${seminarId}/override-status`, { decision, notes })
  },
}

