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


def require_role(*allowed_roles: Role):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user, **kwargs):
            if current_user.role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator


def has_permission(user, permission: str) -> bool:
    return permission in PERMISSIONS.get(user.role, [])


def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user, **kwargs):
            if not has_permission(current_user, permission):
                raise HTTPException(status_code=403, detail=f"Permission '{permission}' required")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
