from enum import Enum
from functools import wraps
from fastapi import HTTPException, Depends


class Role(str, Enum):
    DEAN = "DEAN"
    COORDINATOR = "COORDINATOR"
    TECHNICAL_MODERATOR = "TECHNICAL_MODERATOR"
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
    Role.TECHNICAL_MODERATOR: [
        "manage_session", "generate_meeting_links",
        "upload_materials", "run_technical_check",
        "manage_hybrid_status"
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


def normalize_role_value(role) -> str:
    """
    Normalize role values coming from DB/register forms.
    Ensures case-insensitive checks and supports legacy aliases.
    """
    if role is None:
        return ""
    r = str(role).strip().upper()
    if r == "STUDENT":
        return Role.PHD_CANDIDATE.value
    if r in {"PHD_STUDENT", "PHD STUDENT"}:
        return Role.PHD_CANDIDATE.value
    if r == "PROFESSOR":
        return Role.FACULTY.value
    if r in {"TECHNICAL MODERATOR", "TECH_MODERATOR", "TECHMODERATOR"}:
        return Role.TECHNICAL_MODERATOR.value
    return r


def require_role(*allowed_roles: Role):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user, **kwargs):
            current_role = normalize_role_value(current_user.role)
            allowed_roles_values = {r.value for r in allowed_roles}
            if current_role not in allowed_roles_values:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator


def has_permission(user, permission: str) -> bool:
    normalized_role = normalize_role_value(user.role)
    return permission in PERMISSIONS.get(normalized_role, [])


def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user, **kwargs):
            if not has_permission(current_user, permission):
                raise HTTPException(status_code=403, detail=f"Permission '{permission}' required")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
