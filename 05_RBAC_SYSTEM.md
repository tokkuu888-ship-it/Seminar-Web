# Role-Based Access Control (RBAC)

## Role Hierarchy & Permissions

### DEAN (Highest Authority)
**Permissions:**
- Approve/reject seminar schedules
- View all seminars and presentations
- Access administrative reports
- Manage user roles (assign coordinator)
- View department-wide progress analytics
- Override scheduling conflicts

**Access Level:** Full system access

### COORDINATOR (Senior PhD)
**Permissions:**
- Create and manage seminar schedules
- Send availability polls to faculty
- Assign faculty to review panels
- View all student progress reports
- Send seminar invitations
- Generate progress reports for dean
- Manage room/hybrid setup coordination

**Access Level:** Seminar management + student progress visibility

### FACULTY (Academic Staff)
**Permissions:**
- Respond to availability polls
- View assigned seminars
- Submit faculty viva feedback
- View student progress reports (assigned students only)
- Access presentation materials
- Provide mentorship feedback
- Participate in hybrid sessions

**Access Level:** Assigned seminars + student supervision

### PHD_CANDIDATE (Student)
**Permissions:**
- Submit presentation proposals
- Upload presentation materials
- Submit progress reports
- View own seminar schedule
- Give peer feedback to other students
- View received feedback
- Access own progress history
- Update profile information

**Access Level:** Own data + peer interaction

### ADMIN (System Administrator)
**Permissions:**
- Create/delete users
- Assign all roles
- System configuration
- View audit logs
- Manage database backups
- Monitor system health
- Handle technical issues

**Access Level:** System maintenance + user management

## Backend RBAC Implementation

### Role Enum
```python
# core/rbac.py
from enum import Enum
from functools import wraps
from fastapi import HTTPException, Depends

class Role(str, Enum):
    DEAN = "DEAN"
    COORDINATOR = "COORDINATOR"
    FACULTY = "FACULTY"
    PHD_CANDIDATE = "PHD_CANDIDATE"
    ADMIN = "ADMIN"

ROLE_HIERARCHY = {
    Role.ADMIN: 5,
    Role.DEAN: 4,
    Role.COORDINATOR: 3,
    Role.FACULTY: 2,
    Role.PHD_CANDIDATE: 1,
}

PERMISSIONS = {
    Role.DEAN: [
        "approve_seminars", "view_all_seminars", "view_analytics",
        "assign_coordinator", "override_schedule"
    ],
    Role.COORDINATOR: [
        "create_seminars", "manage_schedule", "send_polls",
        "assign_faculty", "view_all_progress", "invite_participants"
    ],
    Role.FACULTY: [
        "respond_polls", "view_assigned_seminars", "submit_viva",
        "view_assigned_progress", "access_materials", "provide_mentorship"
    ],
    Role.PHD_CANDIDATE: [
        "submit_presentation", "upload_materials", "submit_progress",
        "view_own_schedule", "give_peer_feedback", "view_feedback",
        "update_profile"
    ],
    Role.ADMIN: [
        "manage_users", "assign_roles", "system_config",
        "view_logs", "manage_backups", "monitor_health"
    ],
}
```

### Role Decorator
```python
def require_role(*allowed_roles: Role):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user, **kwargs):
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=403, 
                    detail="Insufficient permissions"
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
```

### Permission Checker
```python
def has_permission(user, permission: str) -> bool:
    return permission in PERMISSIONS.get(user.role, [])

def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user, **kwargs):
            if not has_permission(current_user, permission):
                raise HTTPException(
                    status_code=403, 
                    detail=f"Permission '{permission}' required"
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
```

### Usage in API Routes
```python
# api/v1/seminars/router.py
from ...core.rbac import require_role, Role

@router.post("/")
@require_role(Role.COORDINATOR, Role.ADMIN)
async def create_seminar(
    seminar_data: SeminarCreate,
    current_user: User = Depends(get_current_user)
):
    return await seminar_service.create(seminar_data, current_user)

@router.post("/{id}/approve")
@require_role(Role.DEAN, Role.ADMIN)
async def approve_seminar(
    id: str,
    current_user: User = Depends(get_current_user)
):
    return await seminar_service.approve(id)
```

## Frontend RBAC Implementation

### Role Types
```typescript
// types/user.ts
export type Role = 'DEAN' | 'COORDINATOR' | 'FACULTY' | 'PHD_CANDIDATE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}
```

### Role Permissions
```typescript
// utils/constants.ts
export const ROLE_PERMISSIONS = {
  DEAN: [
    'approve_seminars', 'view_all_seminars', 'view_analytics',
    'assign_coordinator', 'override_schedule'
  ],
  COORDINATOR: [
    'create_seminars', 'manage_schedule', 'send_polls',
    'assign_faculty', 'view_all_progress', 'invite_participants'
  ],
  FACULTY: [
    'respond_polls', 'view_assigned_seminars', 'submit_viva',
    'view_assigned_progress', 'access_materials', 'provide_mentorship'
  ],
  PHD_CANDIDATE: [
    'submit_presentation', 'upload_materials', 'submit_progress',
    'view_own_schedule', 'give_peer_feedback', 'view_feedback',
    'update_profile'
  ],
  ADMIN: [
    'manage_users', 'assign_roles', 'system_config',
    'view_logs', 'manage_backups', 'monitor_health'
  ],
};
```

### Auth Hook with RBAC
```typescript
// hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';
import { Role, ROLE_PERMISSIONS } from '../utils/constants';

export const useAuth = () => {
  const { user } = useAuthStore();
  
  const hasRole = (roles: Role[]) => {
    return user ? roles.includes(user.role) : false;
  };
  
  const hasPermission = (permission: string) => {
    if (!user) return false;
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions?.includes(permission) || false;
  };
  
  return { user, hasRole, hasPermission };
};
```

### Role Guard Component
```typescript
// components/auth/RoleGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types/user';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { user } = useAuthStore();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

### Usage in Components
```typescript
// pages/dashboard/CoordinatorDashboard.tsx
import { RoleGuard } from '../../components/auth/RoleGuard';
import { Role } from '../../types/user';

export const CoordinatorDashboard = () => {
  return (
    <RoleGuard allowedRoles={[Role.COORDINATOR, Role.ADMIN, Role.DEAN]}>
      <div>
        <h1>Coordinator Dashboard</h1>
        {/* Dashboard content */}
      </div>
    </RoleGuard>
  );
};
```

### Conditional Rendering Based on Role
```typescript
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types/user';

export const SeminarActions = () => {
  const { hasRole } = useAuth();
  
  return (
    <div>
      {hasRole([Role.COORDINATOR, Role.ADMIN]) && (
        <Button onClick={handleCreate}>Create Seminar</Button>
      )}
      
      {hasRole([Role.DEAN, Role.ADMIN]) && (
        <Button onClick={handleApprove}>Approve</Button>
      )}
      
      {hasRole([Role.FACULTY]) && (
        <Button onClick={handleFeedback}>Give Feedback</Button>
      )}
    </div>
  );
};
```
