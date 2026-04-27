# PhD Seminar Platform

A comprehensive platform for managing PhD seminar presentations, progress monitoring, and fostering academic community between faculty and students.

## Features

- **User Management**: Role-based access control (DEAN, COORDINATOR, FACULTY, PHD_CANDIDATE, ADMIN)
- **Seminar Management**: Create, schedule, and manage seminars
- **Presentation Tracking**: Submit and track presentation progress
- **Feedback System**: Peer reviews and faculty viva feedback
- **Progress Monitoring**: Progress reports and analytics
- **Availability Polling**: Faculty availability management
- **Real-time Updates**: Live seminar tracking

## Architecture

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Deployment**: Render

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Deployment**: Render

## Project Structure

```
.
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Security, RBAC
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── db/             # Database setup
│   ├── Dockerfile
│   ├── render.yaml
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   ├── render.yaml
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL database

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations (when implemented)
# alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

## Deployment

### Backend (Render)
1. Connect backend repository to Render
2. Create PostgreSQL database
3. Configure environment variables
4. Deploy

### Frontend (Render)
1. Connect frontend repository to Render
2. Configure environment variables
3. Deploy

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Roles & Permissions

### DEAN
- Approve/reject seminar schedules
- View all seminars and presentations
- Access administrative reports
- Assign coordinator role

### COORDINATOR
- Create and manage seminar schedules
- Send availability polls to faculty
- Assign faculty to review panels
- View all student progress reports

### FACULTY
- Respond to availability polls
- View assigned seminars
- Submit faculty viva feedback
- View assigned student progress

### PHD_CANDIDATE
- Submit presentation proposals
- Upload presentation materials
- Submit progress reports
- Give peer feedback

### ADMIN
- Create/delete users
- Assign all roles
- System configuration
- View audit logs

## Documentation

For detailed architecture information, see:
- [Backend Architecture](./01_BACKEND_ARCHITECTURE.md)
- [Frontend Architecture](./02_FRONTEND_ARCHITECTURE.md)
- [API Endpoints](./03_API_ENDPOINTS.md)
- [Authentication System](./04_AUTHENTICATION_SYSTEM.md)
- [RBAC System](./05_RBAC_SYSTEM.md)
- [Database Schema](./06_DATABASE_SCHEMA.md)
- [Render Deployment](./07_RENDER_DEPLOYMENT.md)
- [Development Roadmap](./08_DEVELOPMENT_ROADMAP.md)

## License

MIT License
