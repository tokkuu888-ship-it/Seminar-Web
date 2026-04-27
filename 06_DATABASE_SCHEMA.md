# Database Schema

## Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('DEAN', 'COORDINATOR', 'FACULTY', 'PHD_CANDIDATE', 'ADMIN')),
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

## Seminars Table
```sql
CREATE TABLE seminars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 90,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seminars_date ON seminars(scheduled_date);
CREATE INDEX idx_seminars_status ON seminars(status);
```

## Presentations Table
```sql
CREATE TABLE presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seminar_id UUID REFERENCES seminars(id) ON DELETE CASCADE,
    presenter_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    chapter_topic VARCHAR(255),
    abstract TEXT,
    file_url VARCHAR(500),
    phase VARCHAR(50) DEFAULT 'PRESENTATION' CHECK (phase IN ('PRESENTATION', 'PEER_REVIEW', 'FACULTY_VIVA', 'MENTORSHIP')),
    order_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_presentations_seminar ON presentations(seminar_id);
CREATE INDEX idx_presentations_presenter ON presentations(presenter_id);
```

## Availability Table
```sql
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES users(id),
    poll_id UUID,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_availability_faculty ON availability(faculty_id);
CREATE INDEX idx_availability_date ON availability(available_date);
```

## Feedback Table
```sql
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('PEER', 'FACULTY_VIVA', 'MENTORSHIP')),
    content TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_presentation ON feedback(presentation_id);
CREATE INDEX idx_feedback_reviewer ON feedback(reviewer_id);
```

## Progress Reports Table
```sql
CREATE TABLE progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    seminar_id UUID REFERENCES seminars(id),
    content TEXT NOT NULL,
    milestones_completed TEXT[],
    challenges TEXT,
    next_steps TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_progress_student ON progress_reports(student_id);
CREATE INDEX idx_progress_seminar ON progress_reports(seminar_id);
```

## Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

## Seminar Participants Table (Many-to-Many)
```sql
CREATE TABLE seminar_participants (
    seminar_id UUID REFERENCES seminars(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) CHECK (role IN ('PRESENTER', 'FACULTY_REVIEWER', 'ATTENDEE')),
    PRIMARY KEY (seminar_id, user_id)
);

CREATE INDEX idx_participants_seminar ON seminar_participants(seminar_id);
CREATE INDEX idx_participants_user ON seminar_participants(user_id);
```

## SQLAlchemy Models Example

### User Model
```python
# models/user.py
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from ..db.base import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    department = Column(String(100))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Seminar Model
```python
# models/seminar.py
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid

class Seminar(Base):
    __tablename__ = "seminars"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    scheduled_date = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=90)
    location = Column(String(255))
    meeting_link = Column(String(500))
    status = Column(String(50), default='SCHEDULED', index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    presentations = relationship("Presentation", back_populates="seminar", cascade="all, delete-orphan")
    participants = relationship("SeminarParticipant", back_populates="seminar", cascade="all, delete-orphan")
```

## Database Migration (Alembic)

### Initial Migration
```bash
# Generate migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

### Migration File Example
```python
# alembic/versions/001_initial_schema.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])

def downgrade():
    op.drop_index('idx_users_role', 'users')
    op.drop_index('idx_users_email', 'users')
    op.drop_table('users')
```
