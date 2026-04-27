from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ....db.base import get_db
from ....models.seminar import Seminar
from ....dependencies import get_current_active_user
from ....core.rbac import Role, require_role
from ....models.user import User

router = APIRouter()


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
        created_by=current_user.id
    )
    
    db.add(new_seminar)
    db.commit()
    db.refresh(new_seminar)
    
    return {
        "id": str(new_seminar.id),
        "title": new_seminar.title,
        "scheduled_date": new_seminar.scheduled_date,
        "status": new_seminar.status
    }
