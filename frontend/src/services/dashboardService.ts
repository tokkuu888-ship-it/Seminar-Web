import api from './api'

export const dashboardService = {
  getDean() {
    return api.get('/dashboard/dean')
  },
  getCoordinator() {
    return api.get('/dashboard/coordinator')
  },
  getTechnicalModerator() {
    return api.get('/dashboard/technical-moderator')
  },
  getFaculty() {
    return api.get('/dashboard/faculty')
  },
  getStudent() {
    return api.get('/dashboard/student')
  },
  getSystemReports() {
    return api.get('/dashboard/system-reports')
  },
}

