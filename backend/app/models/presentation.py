from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..db.base import Base


class Presentation(Base):
    __tablename__ = "presentations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seminar_id = Column(UUID(as_uuid=True), ForeignKey('seminars.id', ondelete='CASCADE'))
    presenter_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    title = Column(String(255), nullable=False)
    chapter_topic = Column(String(255))
    abstract = Column(Text)
    file_url = Column(String(500))
    phase = Column(String(50), default='PRESENTATION')
    order_index = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
