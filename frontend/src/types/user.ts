export type Role =
  | 'DEAN'
  | 'COORDINATOR'
  | 'TECHNICAL_MODERATOR'
  | 'FACULTY'
  | 'PHD_CANDIDATE'
  | 'ADMIN'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: Role
  department?: string
  phone?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}
