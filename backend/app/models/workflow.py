from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from ..db.base import Base


class SeminarRoleAssignment(Base):
    __tablename__ = "seminar_role_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Who presents (PhD student)
    presenter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Who controls logistics (Senior PhD / Coordinator)
    coordinator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Who handles session execution (Technical Moderator)
    technical_moderator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SeminarFacultyAssignment(Base):
    __tablename__ = "seminar_faculty_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("seminar_id", "faculty_id", name="uq_seminar_faculty"),)


class AvailabilityPoll(Base):
    __tablename__ = "availability_polls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coordinator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    status = Column(String(20), default="OPEN", index=True)  # OPEN/CLOSED
    question = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AvailabilityPollResponse(Base):
    __tablename__ = "availability_poll_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id = Column(UUID(as_uuid=True), ForeignKey("availability_polls.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    available_days = Column(Text, nullable=True)
    available_time = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("poll_id", "faculty_id", name="uq_poll_faculty"),)


class SeminarApproval(Base):
    __tablename__ = "seminar_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False, unique=True)
    dean_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    decision = Column(String(20), nullable=False)  # APPROVED/REJECTED
    notes = Column(Text, nullable=True)

    decided_at = Column(DateTime(timezone=True), server_default=func.now())


class ProgressReport(Base):
    __tablename__ = "progress_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    title = Column(String(255), nullable=True)
    achievements = Column(Text, nullable=True)
    challenges = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)

    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint("seminar_id", "student_id", name="uq_progress_seminar_student"),)


class SeminarFeedback(Base):
    __tablename__ = "seminar_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    rating = Column(Integer, nullable=True)
    positive = Column(Text, nullable=True)
    corrective = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("seminar_id", "student_id", "faculty_id", name="uq_feedback_triplet"),)


class TechnicalCheck(Base):
    __tablename__ = "technical_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    moderator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    latex_compatible = Column(Boolean, nullable=False, default=False)
    hybrid_status = Column(String(50), nullable=True)  # e.g. READY / NEEDS_ATTENTION
    meeting_link_valid = Column(Boolean, nullable=False, default=False)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("seminar_id", "moderator_id", name="uq_technical_check"),)


class SeminarAttendance(Base):
    __tablename__ = "seminar_attendance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    status = Column(String(30), nullable=False, default="PRESENT")  # PRESENT/MISSED/UNKNOWN
    marked_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("seminar_id", "user_id", name="uq_attendance_pair"),)


class SeminarNotification(Base):
    __tablename__ = "seminar_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    coordinator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notification_type = Column(String(30), nullable=False)  # INVITE / REMINDER
    status = Column(String(20), nullable=False, default="SENT")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("seminar_id", "notification_type", name="uq_seminar_notification_type"),)


class SeminarSession(Base):
    __tablename__ = "seminar_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False, unique=True)
    moderator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    session_status = Column(String(20), nullable=False, default="STARTED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SeminarMaterialUpload(Base):
    __tablename__ = "seminar_material_uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    uploader_kind = Column(String(30), nullable=False)  # STUDENT / TECH_MODERATOR / COORDINATOR
    file_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TechnicalIssue(Base):
    __tablename__ = "technical_issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    issue_type = Column(String(50), nullable=True)  # LATEX / AUDIO / HYBRID / ROOM / OTHER
    description = Column(Text, nullable=True)
    resolved = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SeminarVivaParticipation(Base):
    __tablename__ = "seminar_viva_participation"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("seminar_id", "faculty_id", name="uq_viva_faculty"),)


class PresentationReadiness(Base):
    __tablename__ = "presentation_readiness"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey("seminars.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_url = Column(String(500))
    notes = Column(Text, nullable=True)
    ready_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("seminar_id", "student_id", name="uq_presentation_readiness"),)

