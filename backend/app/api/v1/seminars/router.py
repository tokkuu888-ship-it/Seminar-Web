from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from ....db.base import get_db
from ....models.seminar import Seminar
from ....dependencies import get_current_active_user
from ....core.rbac import Role, require_role
from ....models.user import User
from ....models.workflow import (
    SeminarRoleAssignment,
    SeminarFacultyAssignment,
    SeminarApproval,
    ProgressReport,
    SeminarFeedback,
    TechnicalCheck,
    SeminarAttendance,
    SeminarNotification,
    SeminarSession,
    SeminarMaterialUpload,
    TechnicalIssue,
    SeminarVivaParticipation,
    PresentationReadiness,
)

router = APIRouter()

def _parse_uuid_or_none(value: Any) -> Optional[UUID]:
    if value is None:
        return None
    if isinstance(value, UUID):
        return value
    s = str(value).strip()
    if not s:
        return None
    return UUID(s)


@router.get("/", response_model=List[dict])
async def get_seminars(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    seminars = db.query(Seminar).offset(skip).limit(limit).all()
    return [
        {
            "id": str(seminar.id),
            "title": seminar.title,
            "description": seminar.description,
            "scheduled_date": seminar.scheduled_date,
            "duration_minutes": seminar.duration_minutes,
            "location": seminar.location,
            "meeting_link": seminar.meeting_link,
            "status": seminar.status,
            "created_at": seminar.created_at
        }
        for seminar in seminars
    ]


@router.post("/", response_model=dict)
@require_role(Role.COORDINATOR, Role.ADMIN)
async def create_seminar(
    seminar_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_seminar = Seminar(
        title=seminar_data.get("title"),
        description=seminar_data.get("description"),
        scheduled_date=seminar_data.get("scheduled_date"),
        duration_minutes=seminar_data.get("duration_minutes", 90),
        location=seminar_data.get("location"),
        meeting_link=seminar_data.get("meeting_link"),
        status="PENDING_APPROVAL",
        created_by=current_user.id,
    )
    
    db.add(new_seminar)
    db.commit()
    db.refresh(new_seminar)
    
    # Role assignment is what later dashboards and enforcement rely on.
    role_assignment = SeminarRoleAssignment(
        seminar_id=new_seminar.id,
        presenter_id=_parse_uuid_or_none(seminar_data.get("presenter_id")),
        coordinator_id=current_user.id,
        technical_moderator_id=_parse_uuid_or_none(seminar_data.get("technical_moderator_id")),
    )
    db.add(role_assignment)
    db.commit()

    return {
        "id": str(new_seminar.id),
        "title": new_seminar.title,
        "scheduled_date": new_seminar.scheduled_date,
        "status": new_seminar.status,
    }


@router.post("/{seminar_id}/assign-faculty", response_model=dict)
@require_role(Role.COORDINATOR, Role.ADMIN)
async def assign_faculty_panel(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    faculty_ids = payload.get("faculty_ids") or []
    if not isinstance(faculty_ids, list) or not faculty_ids:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="faculty_ids must be a non-empty list")

    faculty_uuid_ids: List[UUID] = []
    for fid in faculty_ids:
        faculty_uuid_ids.append(UUID(str(fid)))

    # Clear existing assignments for this seminar (keeps assignment workflow clean).
    db.query(SeminarFacultyAssignment).filter(SeminarFacultyAssignment.seminar_id == seminar_uuid).delete()
    db.commit()

    for faculty_id in faculty_ids:
        db.add(SeminarFacultyAssignment(seminar_id=seminar_uuid, faculty_id=UUID(str(faculty_id))))

    db.commit()
    return {"ok": True, "seminar_id": seminar_id, "assigned_faculty_count": len(faculty_uuid_ids)}


@router.post("/{seminar_id}/approval", response_model=dict)
@require_role(Role.DEAN, Role.ADMIN)
async def approve_or_reject_schedule(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    decision = str(payload.get("decision") or "").strip().upper()
    if decision not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="decision must be APPROVED or REJECTED")

    # Only allow decision while pending.
    if seminar.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=409, detail=f"Seminar is not pending approval (current status: {seminar.status})")

    seminar.status = decision
    db.add(seminar)
    db.commit()

    db.add(
        SeminarApproval(
            seminar_id=seminar.id,
            dean_id=current_user.id,
            decision=decision,
            notes=payload.get("notes"),
        )
    )
    db.commit()

    return {"ok": True, "seminar_id": seminar_id, "decision": decision}


@router.post("/{seminar_id}/meeting-link", response_model=dict)
@require_role(Role.TECHNICAL_MODERATOR, Role.COORDINATOR, Role.ADMIN)
async def update_meeting_link(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment:
        raise HTTPException(status_code=403, detail="Seminar role assignment missing")

    is_technical_moderator = role_assignment.technical_moderator_id == current_user.id
    is_coordinator = role_assignment.coordinator_id == current_user.id
    if not (is_technical_moderator or is_coordinator):
        raise HTTPException(status_code=403, detail="Only assigned coordinator or technical moderator can manage this seminar")

    # If coordinator runs meeting-link updates, we still store technical checks against the assigned technical moderator.
    check_moderator_id = role_assignment.technical_moderator_id or current_user.id

    if seminar.status not in {"APPROVED", "IN_PROGRESS", "COMPLETED"}:
        raise HTTPException(status_code=409, detail=f"Seminar not approved (current status: {seminar.status})")

    meeting_link = payload.get("meeting_link")
    if not meeting_link:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="meeting_link is required")

    seminar.meeting_link = meeting_link
    if seminar.status == "APPROVED":
        seminar.status = "IN_PROGRESS"

    db.add(seminar)
    db.commit()

    # Record (or update) technical check as "meeting link valid".
    existing_check = (
        db.query(TechnicalCheck)
        .filter(TechnicalCheck.seminar_id == seminar.id, TechnicalCheck.moderator_id == check_moderator_id)
        .first()
    )
    if existing_check:
        existing_check.meeting_link_valid = True
        existing_check.hybrid_status = payload.get("hybrid_status") or existing_check.hybrid_status
        existing_check.notes = payload.get("notes") or existing_check.notes
        # Keep latex_compatible as-is unless explicitly set in a later technical-check.
    else:
        db.add(
            TechnicalCheck(
                seminar_id=seminar.id,
                moderator_id=check_moderator_id,
                latex_compatible=False,
                hybrid_status=payload.get("hybrid_status") or "UNKNOWN",
                meeting_link_valid=True,
                notes=payload.get("notes"),
            )
        )
    db.commit()

    return {"ok": True, "seminar_id": seminar_id, "meeting_link_updated": True}


@router.post("/{seminar_id}/technical-check", response_model=dict)
@require_role(Role.TECHNICAL_MODERATOR, Role.COORDINATOR, Role.ADMIN)
async def create_technical_check(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment:
        raise HTTPException(status_code=403, detail="Seminar role assignment missing")

    is_technical_moderator = role_assignment.technical_moderator_id == current_user.id
    is_coordinator = role_assignment.coordinator_id == current_user.id
    if not (is_technical_moderator or is_coordinator):
        raise HTTPException(status_code=403, detail="Only assigned coordinator or technical moderator can run checks for this seminar")

    # Store technical check under the assigned technical moderator so the technical moderator dashboard can see it.
    check_moderator_id = role_assignment.technical_moderator_id
    if not check_moderator_id:
        raise HTTPException(status_code=409, detail="technical_moderator_id is not assigned for this seminar")

    if seminar.status not in {"APPROVED", "IN_PROGRESS"}:
        raise HTTPException(status_code=409, detail=f"Seminar not in a technical-checkable state (current status: {seminar.status})")

    existing_check = (
        db.query(TechnicalCheck)
        .filter(TechnicalCheck.seminar_id == seminar.id, TechnicalCheck.moderator_id == check_moderator_id)
        .first()
    )
    if existing_check:
        existing_check.latex_compatible = bool(payload.get("latex_compatible", False))
        existing_check.hybrid_status = payload.get("hybrid_status") or existing_check.hybrid_status
        existing_check.meeting_link_valid = bool(payload.get("meeting_link_valid", False))
        existing_check.notes = payload.get("notes") or existing_check.notes
    else:
        db.add(
            TechnicalCheck(
                seminar_id=seminar.id,
                moderator_id=check_moderator_id,
                latex_compatible=bool(payload.get("latex_compatible", False)),
                hybrid_status=payload.get("hybrid_status"),
                meeting_link_valid=bool(payload.get("meeting_link_valid", False)),
                notes=payload.get("notes"),
            )
        )
    db.commit()

    return {"ok": True, "seminar_id": seminar_id}


@router.post("/{seminar_id}/start-session", response_model=dict)
@require_role(Role.TECHNICAL_MODERATOR, Role.COORDINATOR, Role.ADMIN)
async def start_session(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment:
        raise HTTPException(status_code=403, detail="Seminar role assignment missing")

    is_tech = role_assignment.technical_moderator_id == current_user.id
    is_coord = role_assignment.coordinator_id == current_user.id
    if not (is_tech or is_coord):
        raise HTTPException(status_code=403, detail="Only assigned coordinator/technical moderator can start the session")

    meeting_link = payload.get("meeting_link") or seminar.meeting_link
    if not meeting_link:
        raise HTTPException(status_code=422, detail="meeting_link is required to start session")

    # Create or update session record
    session = db.query(SeminarSession).filter(SeminarSession.seminar_id == seminar_uuid).first()
    moderator_id = role_assignment.technical_moderator_id or current_user.id
    if session:
        session.session_status = "STARTED"
    else:
        db.add(SeminarSession(seminar_id=seminar_uuid, moderator_id=moderator_id, session_status="STARTED"))

    # Move seminar into IN_PROGRESS if approved/pending approval
    if seminar.status == "APPROVED":
        seminar.status = "IN_PROGRESS"

    db.commit()
    return {"ok": True, "seminar_id": seminar_id, "session_started": True}


@router.post("/{seminar_id}/technical-materials", response_model=dict)
@require_role(Role.TECHNICAL_MODERATOR, Role.ADMIN)
async def upload_technical_materials(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment or role_assignment.technical_moderator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned technical moderator can upload technical materials")

    file_url = payload.get("file_url")
    if not file_url:
        raise HTTPException(status_code=422, detail="file_url is required")

    db.add(
        SeminarMaterialUpload(
            seminar_id=seminar_uuid,
            uploader_id=current_user.id,
            uploader_kind="TECH_MODERATOR",
            file_url=file_url,
        )
    )
    db.commit()
    return {"ok": True, "seminar_id": seminar_id, "uploaded": True}


@router.post("/{seminar_id}/technical-issues", response_model=dict)
@require_role(Role.TECHNICAL_MODERATOR, Role.ADMIN)
async def report_technical_issue(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment or role_assignment.technical_moderator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned technical moderator can report issues")

    issue_type = payload.get("issue_type") or "OTHER"
    description = payload.get("description")

    db.add(
        TechnicalIssue(
            seminar_id=seminar_uuid,
            reporter_id=current_user.id,
            issue_type=issue_type,
            description=description,
            resolved=bool(payload.get("resolved", False)),
        )
    )
    db.commit()
    return {"ok": True, "seminar_id": seminar_id, "issue_reported": True}


@router.post("/{seminar_id}/student-preparation", response_model=dict)
@require_role(Role.PHD_CANDIDATE, Role.ADMIN)
async def student_prepare_presentation(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment or role_assignment.presenter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned presenter can mark readiness for this seminar")

    file_url = payload.get("file_url")
    notes = payload.get("notes")

    existing = db.query(PresentationReadiness).filter(PresentationReadiness.seminar_id == seminar_uuid, PresentationReadiness.student_id == current_user.id).first()
    if existing:
        existing.file_url = file_url or existing.file_url
        existing.notes = notes or existing.notes
    else:
        db.add(
            PresentationReadiness(
                seminar_id=seminar_uuid,
                student_id=current_user.id,
                file_url=file_url,
                notes=notes,
            )
        )

    db.commit()
    return {"ok": True, "seminar_id": seminar_id, "presentation_ready": True}


@router.post("/{seminar_id}/viva-participate", response_model=dict)
@require_role(Role.FACULTY, Role.ADMIN)
async def viva_participate(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    faculty_assigned = (
        db.query(SeminarFacultyAssignment)
        .filter(SeminarFacultyAssignment.seminar_id == seminar_uuid, SeminarFacultyAssignment.faculty_id == current_user.id)
        .first()
    )
    if not faculty_assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this seminar as a faculty panel member")

    notes = payload.get("notes")

    existing = db.query(SeminarVivaParticipation).filter(SeminarVivaParticipation.seminar_id == seminar_uuid, SeminarVivaParticipation.faculty_id == current_user.id).first()
    if existing:
        existing.notes = notes or existing.notes
    else:
        db.add(SeminarVivaParticipation(seminar_id=seminar_uuid, faculty_id=current_user.id, notes=notes))

    # Keep workflow integrity: viva participation is only meaningful after session start.
    if seminar.status == "APPROVED":
        seminar.status = "IN_PROGRESS"

    db.commit()
    return {"ok": True, "seminar_id": seminar_id, "viva_participated": True}


@router.post("/{seminar_id}/notifications", response_model=dict)
@require_role(Role.COORDINATOR, Role.ADMIN)
async def send_notification(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    # Only coordinator who created the seminar can send reminders.
    if seminar.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not your seminar")

    notification_type = str(payload.get("notification_type") or "").strip().upper()
    if notification_type not in {"INVITE", "REMINDER"}:
        raise HTTPException(status_code=422, detail="notification_type must be INVITE or REMINDER")

    existing = (
        db.query(SeminarNotification)
        .filter(SeminarNotification.seminar_id == seminar_uuid, SeminarNotification.notification_type == notification_type)
        .first()
    )
    if existing:
        return {"ok": True, "already_sent": True, "seminar_id": seminar_id, "notification_type": notification_type}

    db.add(
        SeminarNotification(
            seminar_id=seminar_uuid,
            coordinator_id=current_user.id,
            notification_type=notification_type,
            status="SENT",
        )
    )
    db.commit()
    return {"ok": True, "already_sent": False, "seminar_id": seminar_id, "notification_type": notification_type}


@router.post("/{seminar_id}/override-status", response_model=dict)
@require_role(Role.ADMIN)
async def override_status(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    decision = str(payload.get("decision") or "").strip().upper()
    if decision not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=422, detail="decision must be APPROVED or REJECTED")

    # Only override from REJECTED -> APPROVED (or ADMIN wants to force).
    seminar.status = decision
    db.add(
        SeminarApproval(
            seminar_id=seminar_uuid,
            dean_id=current_user.id,
            decision=decision,
            notes=payload.get("notes") or "Admin override",
        )
    )
    db.commit()
    return {"ok": True, "seminar_id": seminar_id, "decision": decision}



@router.post("/{seminar_id}/attendance", response_model=dict)
@require_role(Role.TECHNICAL_MODERATOR, Role.COORDINATOR, Role.ADMIN)
async def mark_attendance(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment or role_assignment.technical_moderator_id != current_user.id:
        is_coordinator = role_assignment.coordinator_id == current_user.id
        if not is_coordinator:
            raise HTTPException(status_code=403, detail="Only assigned coordinator or technical moderator can mark attendance")

    if seminar.status not in {"IN_PROGRESS", "COMPLETED"}:
        raise HTTPException(status_code=409, detail=f"Attendance can be marked only for IN_PROGRESS/COMPLETED seminars (current: {seminar.status})")

    participant_ids = payload.get("participant_ids") or []
    status_value = str(payload.get("status") or "PRESENT").strip().upper()
    if not isinstance(participant_ids, list) or not participant_ids:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="participant_ids must be a non-empty list")

    for participant_id in participant_ids:
        existing = (
            db.query(SeminarAttendance)
            .filter(SeminarAttendance.seminar_id == seminar_uuid, SeminarAttendance.user_id == participant_id)
            .first()
        )
        if existing:
            existing.status = status_value
        else:
            db.add(SeminarAttendance(seminar_id=seminar_uuid, user_id=participant_id, status=status_value))

    db.commit()
    return {"ok": True, "seminar_id": seminar_id, "participants_marked": len(participant_ids)}


@router.post("/{seminar_id}/progress-report", response_model=dict)
@require_role(Role.PHD_CANDIDATE, Role.ADMIN)
async def submit_progress_report(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment or role_assignment.presenter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned PhD student can submit a progress report for this seminar")

    # Prevent duplicate submissions for the same seminar/student.
    existing = (
        db.query(ProgressReport)
        .filter(ProgressReport.seminar_id == seminar_uuid, ProgressReport.student_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Progress report already submitted for this seminar")

    db.add(
        ProgressReport(
            seminar_id=seminar.id,
            student_id=current_user.id,
            title=payload.get("title"),
            achievements=payload.get("achievements"),
            challenges=payload.get("challenges"),
            next_steps=payload.get("next_steps"),
        )
    )
    db.commit()

    return {"ok": True, "seminar_id": seminar_id}


@router.get("/{seminar_id}/progress-reports", response_model=List[dict])
@require_role(Role.FACULTY, Role.COORDINATOR, Role.ADMIN)
async def get_progress_reports_for_faculty(
    seminar_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    seminar = db.query(Seminar).filter(Seminar.id == seminar_uuid).first()
    if not seminar:
        raise HTTPException(status_code=404, detail="Seminar not found")

    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()

    # Enforce: coordinator (workflow controller) or assigned faculty can view.
    is_assigned_faculty = (
        db.query(SeminarFacultyAssignment)
        .filter(SeminarFacultyAssignment.seminar_id == seminar_uuid, SeminarFacultyAssignment.faculty_id == current_user.id)
        .first()
        is not None
    )
    is_coordinator = (
        seminar.created_by == current_user.id
        or (role_assignment and role_assignment.coordinator_id == current_user.id)
    )
    if not (is_assigned_faculty or is_coordinator):
        raise HTTPException(status_code=403, detail="Insufficient permissions to view progress reports")

    reports = db.query(ProgressReport).filter(ProgressReport.seminar_id == seminar_uuid).all()
    return [
        {
            "id": str(r.id),
            "seminar_id": str(r.seminar_id),
            "student_id": str(r.student_id),
            "title": r.title,
            "achievements": r.achievements,
            "challenges": r.challenges,
            "next_steps": r.next_steps,
            "submitted_at": r.submitted_at,
        }
        for r in reports
    ]


@router.post("/{seminar_id}/feedback", response_model=dict)
@require_role(Role.FACULTY, Role.ADMIN)
async def submit_feedback(
    seminar_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminar_uuid = UUID(str(seminar_id))
    # Enforce: only assigned faculty can submit feedback.
    assigned = (
        db.query(SeminarFacultyAssignment)
        .filter(SeminarFacultyAssignment.seminar_id == seminar_uuid, SeminarFacultyAssignment.faculty_id == current_user.id)
        .first()
    )
    if not assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this seminar as a faculty panel member")

    student_id = payload.get("student_id")
    if not student_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="student_id is required")

    # Ensure the target student is actually assigned as presenter.
    role_assignment = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == seminar_uuid).first()
    if not role_assignment or str(role_assignment.presenter_id) != str(student_id):
        raise HTTPException(status_code=403, detail="student_id is not the assigned PhD presenter for this seminar")

    existing = (
        db.query(SeminarFeedback)
        .filter(
            SeminarFeedback.seminar_id == seminar_uuid,
            SeminarFeedback.student_id == student_id,
            SeminarFeedback.faculty_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Feedback already submitted")

    db.add(
        SeminarFeedback(
            seminar_id=seminar_uuid,
            student_id=student_id,
            faculty_id=current_user.id,
            rating=payload.get("rating"),
            positive=payload.get("positive"),
            corrective=payload.get("corrective"),
            comments=payload.get("comments"),
        )
    )
    db.commit()

    return {"ok": True, "seminar_id": seminar_id}

