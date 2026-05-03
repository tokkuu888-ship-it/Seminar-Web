export interface Seminar {
  id: string
  title: string
  description?: string
  scheduled_date: string
  duration_minutes?: number
  location?: string
  meeting_link?: string
  status?: string
  created_at?: string
  // Workflow assignment fields (optional; set by coordinator during schedule creation)
  presenter_id?: string
  technical_moderator_id?: string
}
