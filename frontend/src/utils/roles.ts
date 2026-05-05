import { Role } from '../types/user'

export type NormalizedRole = Role

export function normalizeRoleValue(role: string | null | undefined): NormalizedRole | undefined {
  if (!role) return undefined
  const r = String(role).trim().toUpperCase()

  // Legacy aliases (registration/UI may have used these historically)
  if (r === 'STUDENT' || r === 'PHD STUDENT') return 'PHD_CANDIDATE'
  if (r === 'PROFESSOR') return 'FACULTY'
  if (r === 'TECH MODERATOR' || r === 'TECHNICAL MODERATOR' || r === 'TECHMODERATOR' || r === 'TECH_MODERATOR') {
    return 'TECHNICAL_MODERATOR'
  }

  // Already normalized
  if (r === 'DEAN' || r === 'COORDINATOR' || r === 'TECHNICAL_MODERATOR' || r === 'FACULTY' || r === 'PHD_CANDIDATE' || r === 'ADMIN') {
    return r as NormalizedRole
  }

  return undefined
}

export function roleToDashboardPath(role: NormalizedRole | undefined): string {
  switch (role) {
    case 'DEAN':
      return '/dashboard/dean'
    case 'COORDINATOR':
      return '/dashboard/coordinator'
    case 'TECHNICAL_MODERATOR':
      return '/dashboard/technical-moderator'
    case 'FACULTY':
      return '/dashboard/faculty'
    case 'PHD_CANDIDATE':
      return '/dashboard/student'
    case 'ADMIN':
      // Default admin landing to coordinator view (can still be used via RBAC).
      return '/dashboard/coordinator'
    default:
      return '/dashboard'
  }
}

