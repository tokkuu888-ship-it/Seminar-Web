from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ....db.base import get_db
from ....dependencies import get_current_user
from ....core.rbac import Role, require_role
from ....models.user import User
from ....models.workflow import AvailabilityPoll, AvailabilityPollResponse

router = APIRouter()


@router.post("/availability-polls", response_model=dict)
@require_role(Role.COORDINATOR, Role.ADMIN)
async def send_availability_poll(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    poll = AvailabilityPoll(
        coordinator_id=current_user.id,
        question=payload.get("question"),
        status="OPEN",
    )
    db.add(poll)
    db.commit()
    db.refresh(poll)
    return {"ok": True, "poll_id": str(poll.id), "status": poll.status}


@router.post("/availability-polls/{poll_id}/responses", response_model=dict)
@require_role(Role.FACULTY, Role.ADMIN)
async def respond_to_poll(
    poll_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    poll = db.query(AvailabilityPoll).filter(AvailabilityPoll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.status != "OPEN":
        raise HTTPException(status_code=409, detail="Poll is not open")

    existing = (
        db.query(AvailabilityPollResponse)
        .filter(AvailabilityPollResponse.poll_id == poll_id, AvailabilityPollResponse.faculty_id == current_user.id)
        .first()
    )
    if existing:
        # Keep strict integrity: treat it as an update.
        existing.available_days = payload.get("available_days")
        existing.available_time = payload.get("available_time")
        existing.notes = payload.get("notes")
    else:
        db.add(
            AvailabilityPollResponse(
                poll_id=poll_id,
                faculty_id=current_user.id,
                available_days=payload.get("available_days"),
                available_time=payload.get("available_time"),
                notes=payload.get("notes"),
            )
        )

    db.commit()
    return {"ok": True, "poll_id": poll_id}


@router.get("/availability-polls/{poll_id}/responses", response_model=List[dict])
@require_role(Role.COORDINATOR, Role.ADMIN)
async def poll_results_summary(
    poll_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    poll = db.query(AvailabilityPoll).filter(AvailabilityPoll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.coordinator_id != current_user.id and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Not your poll")

    responses = db.query(AvailabilityPollResponse).filter(AvailabilityPollResponse.poll_id == poll_id).all()
    return [
        {
            "id": str(r.id),
            "faculty_id": str(r.faculty_id),
            "available_days": r.available_days,
            "available_time": r.available_time,
            "notes": r.notes,
            "created_at": r.created_at,
        }
        for r in responses
    ]

