from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from ....db.base import get_db
from ....dependencies import get_current_active_user
from ....core.rbac import Role, require_role
from ....models.user import User
from ....models.seminar import Seminar
from ....models.workflow import (
    SeminarRoleAssignment,
    SeminarFacultyAssignment,
    SeminarApproval,
    ProgressReport,
    SeminarFeedback,
    TechnicalCheck,
    SeminarAttendance,
    AvailabilityPoll,
    AvailabilityPollResponse,
    SeminarNotification,
    SeminarSession,
    TechnicalIssue,
    SeminarVivaParticipation,
    PresentationReadiness,
)

router = APIRouter()


def seminar_to_dict(seminar: Seminar) -> Dict[str, Any]:
    return {
        "id": str(seminar.id),
        "title": seminar.title,
        "scheduled_date": seminar.scheduled_date,
        "duration_minutes": seminar.duration_minutes,
        "location": seminar.location,
        "meeting_link": seminar.meeting_link,
        "status": seminar.status,
        "created_at": seminar.created_at,
    }


@router.get("/dashboard/dean", response_model=dict)
@require_role(Role.DEAN, Role.ADMIN)
async def dean_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    pending = db.query(Seminar).filter(Seminar.status == "PENDING_APPROVAL").limit(20).all()

    # Overall summary: progress reports submitted vs seminars that have a presenter assigned.
    role_assignments = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.presenter_id.isnot(None)).all()
    presenter_seminar_count = len(role_assignments)
    submitted_reports_count = db.query(ProgressReport).count()

    # At-risk: seminars scheduled up to now with a presenter but without submitted progress.
    now = datetime.utcnow()
    past_seminars = db.query(Seminar).filter(Seminar.scheduled_date <= now).filter(Seminar.status != "REJECTED").all()
    at_risk = []
    for s in past_seminars:
        ra = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.seminar_id == s.id).first()
        if not ra or not ra.presenter_id:
            continue
        has_report = db.query(ProgressReport).filter(
            ProgressReport.seminar_id == s.id,
            ProgressReport.student_id == ra.presenter_id,
        ).first()
        if not has_report:
            at_risk.append(
                {
                    **seminar_to_dict(s),
                    "presenter_id": str(ra.presenter_id),
                }
            )

    return {
        "role": "DEAN",
        "pending_schedule_approvals": {
            "count": len(pending),
            "items": [seminar_to_dict(s) for s in pending],
        },
        "overall_phd_progress_summary": {
            "progress_reports_submitted": submitted_reports_count,
            "presenter_seminars_total": presenter_seminar_count,
        },
        "at_risk_students": {
            "count": len(at_risk),
            "items": at_risk[:10],
        },
    }


@router.get("/dashboard/coordinator", response_model=dict)
@require_role(Role.COORDINATOR, Role.ADMIN)
async def coordinator_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Any pending approvals for seminars created by this coordinator.
    pending_created_by_me = (
        db.query(Seminar)
        .filter(Seminar.created_by == current_user.id)
        .filter(Seminar.status == "PENDING_APPROVAL")
        .limit(20)
        .all()
    )

    # Polls created by this coordinator: open one plus summary.
    open_poll = (
        db.query(AvailabilityPoll)
        .filter(AvailabilityPoll.coordinator_id == current_user.id)
        .filter(AvailabilityPoll.status == "OPEN")
        .order_by(AvailabilityPoll.created_at.desc())
        .first()
    )
    poll_response_count = 0
    poll_responses = []
    poll_response_items: List[Dict[str, Any]] = []
    if open_poll:
        poll_responses = db.query(AvailabilityPollResponse).filter(AvailabilityPollResponse.poll_id == open_poll.id).all()
        poll_response_count = len(poll_responses)
        poll_response_items = [
            {
                "id": str(r.id),
                "faculty_id": str(r.faculty_id),
                "available_days": r.available_days,
                "available_time": r.available_time,
                "notes": r.notes,
                "created_at": r.created_at,
            }
            for r in poll_responses
        ]

    # Submitted progress reports for seminars created by this coordinator.
    my_seminar_ids = [s.id for s in db.query(Seminar).filter(Seminar.created_by == current_user.id).all()]
    submitted_reports_count = 0
    submitted_reports_items: List[Dict[str, Any]] = []
    if my_seminar_ids:
        submitted_reports_count = db.query(ProgressReport).filter(ProgressReport.seminar_id.in_(my_seminar_ids)).count()
        reports = (
            db.query(ProgressReport)
            .filter(ProgressReport.seminar_id.in_(my_seminar_ids))
            .order_by(ProgressReport.submitted_at.desc())
            .limit(10)
            .all()
        )
        submitted_reports_items = [
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

    # Notification queues (workflow triggers)
    approved_seminars = (
        db.query(Seminar)
        .filter(Seminar.created_by == current_user.id)
        .filter(Seminar.status == "APPROVED")
        .all()
    )

    invite_queue = []
    for s in approved_seminars:
        has_invite = (
            db.query(SeminarNotification)
            .filter(SeminarNotification.seminar_id == s.id, SeminarNotification.notification_type == "INVITE")
            .first()
        )
        if not has_invite:
            invite_queue.append(seminar_to_dict(s))

    in_progress_seminars = (
        db.query(Seminar)
        .filter(Seminar.created_by == current_user.id)
        .filter(Seminar.status == "IN_PROGRESS")
        .all()
    )
    reminder_queue = []
    for s in in_progress_seminars:
        has_reminder = (
            db.query(SeminarNotification)
            .filter(SeminarNotification.seminar_id == s.id, SeminarNotification.notification_type == "REMINDER")
            .first()
        )
        if not has_reminder:
            reminder_queue.append(seminar_to_dict(s))

    return {
        "role": "COORDINATOR",
        "pending_schedule_approvals": {"count": len(pending_created_by_me), "items": [seminar_to_dict(s) for s in pending_created_by_me]},
        "poll_results_summary": {
            "open_poll_id": str(open_poll.id) if open_poll else None,
            "responses_count": poll_response_count,
            "items": poll_response_items,
        },
        "submitted_progress_reports": {
            "count": submitted_reports_count,
            "items": submitted_reports_items,
        },
        "notification_queues": {
            "invite_queue": invite_queue[:10],
            "reminder_queue": reminder_queue[:10],
        },
    }


@router.get("/dashboard/technical-moderator", response_model=dict)
@require_role(Role.TECHNICAL_MODERATOR, Role.ADMIN)
async def technical_moderator_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    today = datetime.utcnow().date()
    todays_sessions = (
        db.query(Seminar)
        .join(SeminarRoleAssignment, SeminarRoleAssignment.seminar_id == Seminar.id)
        .filter(SeminarRoleAssignment.technical_moderator_id == current_user.id)
        .filter(Seminar.scheduled_date >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
        .filter(Seminar.scheduled_date <= datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999))
        .limit(20)
        .all()
    )

    sessions_items = []
    for s in todays_sessions:
        tc = (
            db.query(TechnicalCheck)
            .filter(TechnicalCheck.seminar_id == s.id)
            .filter(TechnicalCheck.moderator_id == current_user.id)
            .order_by(TechnicalCheck.created_at.desc())
            .first()
        )
        sessions_items.append(
            {
                **seminar_to_dict(s),
                "hybrid_status": tc.hybrid_status if tc else None,
                "latex_compatible": tc.latex_compatible if tc else None,
                "meeting_link_valid": tc.meeting_link_valid if tc else None,
            }
        )

    return {
        "role": "TECHNICAL_MODERATOR",
        "todays_sessions": {"count": len(sessions_items), "items": sessions_items},
    }


@router.get("/dashboard/faculty", response_model=dict)
@require_role(Role.FACULTY, Role.ADMIN)
async def faculty_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    assigned_seminars = (
        db.query(Seminar)
        .join(SeminarFacultyAssignment, SeminarFacultyAssignment.seminar_id == Seminar.id)
        .filter(SeminarFacultyAssignment.faculty_id == current_user.id)
        .order_by(Seminar.scheduled_date.asc())
        .limit(20)
        .all()
    )

    assigned_ids = [s.id for s in assigned_seminars]
    quick_reports = []
    if assigned_ids:
        reports = (
            db.query(ProgressReport)
            .filter(ProgressReport.seminar_id.in_(assigned_ids))
            .order_by(ProgressReport.submitted_at.desc())
            .limit(5)
            .all()
        )
        for r in reports:
            quick_reports.append(
                {
                    "id": str(r.id),
                    "seminar_id": str(r.seminar_id),
                    "student_id": str(r.student_id),
                    "title": r.title,
                    "submitted_at": r.submitted_at,
                    "achievements": r.achievements,
                    "challenges": r.challenges,
                    "next_steps": r.next_steps,
                }
            )

    return {
        "role": "FACULTY",
        "assigned_sessions": {"count": len(assigned_seminars), "items": [seminar_to_dict(s) for s in assigned_seminars]},
        "student_progress_reports_quick": {"count": len(quick_reports), "items": quick_reports},
    }


@router.get("/dashboard/student", response_model=dict)
@require_role(Role.PHD_CANDIDATE, Role.ADMIN)
async def student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    role_assignment_rows = db.query(SeminarRoleAssignment).filter(SeminarRoleAssignment.presenter_id == current_user.id).all()
    seminar_ids = [ra.seminar_id for ra in role_assignment_rows]

    # My upcoming seminar: nearest future scheduled_date.
    upcoming = []
    if seminar_ids:
        upcoming = (
            db.query(Seminar)
            .filter(Seminar.id.in_(seminar_ids))
            .filter(Seminar.scheduled_date >= datetime.utcnow())
            .order_by(Seminar.scheduled_date.asc())
            .limit(5)
            .all()
        )

    upcoming_items = [seminar_to_dict(s) for s in upcoming]

    # My timeline: progress reports by submission time.
    reports = []
    if seminar_ids:
        reports = (
            db.query(ProgressReport)
            .filter(ProgressReport.student_id == current_user.id)
            .order_by(ProgressReport.submitted_at.asc())
            .all()
        )

    timeline_items = [
        {
            "id": str(r.id),
            "seminar_id": str(r.seminar_id),
            "title": r.title,
            "achievements": r.achievements,
            "challenges": r.challenges,
            "next_steps": r.next_steps,
            "submitted_at": r.submitted_at,
        }
        for r in reports
    ]

    # Feedback received.
    feedbacks = []
    if seminar_ids:
        feedbacks = (
            db.query(SeminarFeedback)
            .filter(SeminarFeedback.student_id == current_user.id)
            .order_by(SeminarFeedback.created_at.desc())
            .limit(10)
            .all()
        )

    feedback_items = [
        {
            "id": str(f.id),
            "seminar_id": str(f.seminar_id),
            "faculty_id": str(f.faculty_id),
            "rating": f.rating,
            "positive": f.positive,
            "corrective": f.corrective,
            "comments": f.comments,
            "created_at": f.created_at,
        }
        for f in feedbacks
    ]

    return {
        "role": "PHD_CANDIDATE",
        "my_upcoming_seminar": {"count": len(upcoming_items), "items": upcoming_items},
        "progress_timeline": {"count": len(timeline_items), "items": timeline_items},
        "feedback_received": {"count": len(feedback_items), "items": feedback_items},
    }


@router.get("/dashboard/system-reports", response_model=dict)
@require_role(Role.DEAN, Role.ADMIN)
async def system_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seminars_total = db.query(Seminar).count()
    seminars_by_status_rows = db.query(Seminar.status, func.count(Seminar.id)).group_by(Seminar.status).all()
    seminars_by_status = {status: count for status, count in seminars_by_status_rows}

    polls_open = db.query(AvailabilityPoll).filter(AvailabilityPoll.status == "OPEN").count()
    progress_reports_total = db.query(ProgressReport).count()
    feedback_total = db.query(SeminarFeedback).count()
    technical_checks_total = db.query(TechnicalCheck).count()
    vivos_total = db.query(SeminarVivaParticipation).count()
    sessions_started_total = db.query(SeminarSession).count()
    readiness_total = db.query(PresentationReadiness).count()
    rejected_recent = (
        db.query(Seminar)
        .filter(Seminar.status == "REJECTED")
        .order_by(Seminar.updated_at.desc())
        .limit(10)
        .all()
    )

    return {
        "role": "DEAN",
        "seminars_total": seminars_total,
        "seminars_by_status": seminars_by_status,
        "rejected_recent": {"count": len(rejected_recent), "items": [seminar_to_dict(s) for s in rejected_recent]},
        "availability_polls_open": polls_open,
        "progress_reports_total": progress_reports_total,
        "feedback_total": feedback_total,
        "technical_checks_total": technical_checks_total,
        "viva_participation_total": vivos_total,
        "sessions_started_total": sessions_started_total,
        "presentation_readiness_total": readiness_total,
    }

