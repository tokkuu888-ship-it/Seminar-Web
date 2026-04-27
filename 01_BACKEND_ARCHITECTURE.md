# Backend Architecture

## Technology Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (Render PostgreSQL)
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt
- **Email**: FastAPI Mail
- **File Storage**: AWS S3 / Render Object Storage
- **Task Queue**: Celery + Redis
- **API Documentation**: OpenAPI/Swagger (built-in)

## Backend File Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Environment variables and settings
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing
│   │   ├── rbac.py             # Role-based access control
│   │   └── exceptions.py       # Custom exceptions
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # User model
│   │   ├── seminar.py          # Seminar model
│   │   ├── presentation.py     # Presentation model
│   │   ├── schedule.py         # Schedule model
│   │   ├── feedback.py         # Feedback model
│   │   ├── progress_report.py  # Progress report model
│   │   └── availability.py     # Faculty availability model
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # User DTOs
│   │   ├── seminar.py          # Seminar DTOs
│   │   ├── presentation.py     # Presentation DTOs
│   │   ├── schedule.py         # Schedule DTOs
│   │   ├── feedback.py         # Feedback DTOs
│   │   └── progress_report.py  # Progress report DTOs
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py             # API dependencies
│   │   │
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py       # API v1 router
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py   # Login, signup, password reset
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py   # User management
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── seminars/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py   # Seminar CRUD
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── presentations/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py   # Presentation management
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── schedules/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py   # Scheduling, availability polls
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── feedback/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py   # Peer and faculty feedback
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── progress/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py   # Progress reports
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   └── notifications/
│   │   │       ├── __init__.py
│   │   │       ├── router.py   # Email/push notifications
│   │   │       └── schemas.py
│   │   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Authentication logic
│   │   ├── user_service.py     # User management
│   │   ├── seminar_service.py  # Seminar logic
│   │   ├── schedule_service.py # Scheduling algorithm
│   │   ├── notification_service.py # Email/SMS
│   │   └── file_service.py     # File upload/download
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py       # Celery configuration
│   │   ├── email_tasks.py      # Background email jobs
│   │   └── reminder_tasks.py   # Seminar reminders
│   │
│   └── db/
│       ├── __init__.py
│       ├── base.py             # Base model
│       ├── session.py          # Database session
│       └── init_db.py          # Database initialization
│
├── alembic/                     # Database migrations
│   ├── versions/
│   └── env.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_seminars.py
│   └── test_schedules.py
│
├── .env.example
├── .env
├── requirements.txt
├── Dockerfile
├── render.yaml
└── README.md
```

## Backend Libraries (requirements.txt)
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
fastapi-mail==1.4.1
celery==5.3.6
redis==5.0.1
boto3==1.34.49
httpx==0.26.0
pytest==7.4.4
pytest-asyncio==0.23.3
```

## Environment Variables (.env)
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@seminar-platform.com

AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=seminar-platform
AWS_REGION=us-east-1

REDIS_URL=redis://localhost:6379/0

FRONTEND_URL=https://your-frontend.onrender.com
```

## Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN alembic upgrade head

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
