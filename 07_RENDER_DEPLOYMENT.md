# Render Deployment Configuration

## Backend render.yaml
```yaml
services:
  - type: web
    name: seminar-platform-backend
    env: python
    buildCommand: pip install -r requirements.txt && alembic upgrade head
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: seminar-platform-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: ALGORITHM
        value: HS256
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: "30"
      - key: REDIS_URL
        fromService:
          type: redis
          name: seminar-platform-redis
          property: connectionString
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
      - key: AWS_BUCKET_NAME
        sync: false
      - key: AWS_REGION
        value: us-east-1
      - key: SMTP_HOST
        sync: false
      - key: SMTP_PORT
        sync: false
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASSWORD
        sync: false
      - key: FRONTEND_URL
        value: https://seminar-platform-frontend.onrender.com

databases:
  - name: seminar-platform-db
    databaseName: seminar_platform
    user: seminar_user

redis:
  - name: seminar-platform-redis
    maxmemoryPolicy: allkeys-lru
    ipAllowList: []
```

## Frontend render.yaml
```yaml
services:
  - type: web
    name: seminar-platform-frontend
    env: node
    buildCommand: npm run build
    startCommand: npm run preview
    envVars:
      - key: VITE_API_URL
        value: https://seminar-platform-backend.onrender.com/api/v1
      - key: VITE_APP_NAME
        value: PhD Seminar Platform
```

## Deployment Steps

### 1. Prepare Repositories
- Create separate GitHub repositories for backend and frontend
- Ensure `.gitignore` is properly configured
- Add environment variables to Render dashboard

### 2. Deploy Backend
1. Connect backend repo to Render
2. Create PostgreSQL database
3. Create Redis instance
4. Configure environment variables
5. Deploy

### 3. Deploy Frontend
1. Connect frontend repo to Render
2. Configure environment variables
3. Deploy

### 4. Configure CORS
Add frontend URL to backend CORS settings in `app/main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seminar-platform-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5. Set Up Custom Domain (Optional)
- Purchase domain
- Configure DNS records
- Add custom domain to Render services

## Environment Variables Setup

### Backend Environment Variables (Render Dashboard)
```
DATABASE_URL: (auto-filled from database)
SECRET_KEY: (generate or set)
ALGORITHM: HS256
ACCESS_TOKEN_EXPIRE_MINUTES: 30
REFRESH_TOKEN_EXPIRE_DAYS: 7
REDIS_URL: (auto-filled from Redis)
AWS_ACCESS_KEY_ID: (your AWS key)
AWS_SECRET_ACCESS_KEY: (your AWS secret)
AWS_BUCKET_NAME: seminar-platform
AWS_REGION: us-east-1
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: your-email@gmail.com
SMTP_PASSWORD: your-app-password
FRONTEND_URL: https://seminar-platform-frontend.onrender.com
```

### Frontend Environment Variables (Render Dashboard)
```
VITE_API_URL: https://seminar-platform-backend.onrender.com/api/v1
VITE_APP_NAME: PhD Seminar Platform
```

## Health Checks

### Backend Health Check Endpoint
```python
# api/v1/health/router.py
from fastapi import APIRouter
from sqlalchemy import text
from ...db.session import engine

router = APIRouter()

@router.get("/health")
async def health_check():
    try:
        # Check database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
```

## Monitoring

### Render Built-in Monitoring
- Metrics: CPU, Memory, Response Time
- Logs: Real-time log streaming
- Alerts: Configure for error rates, response times

### Recommended Monitoring Tools
- Sentry for error tracking
- LogRocket for session replay
- New Relic for APM

## Backup Strategy

### Database Backups
Render automatically backs up PostgreSQL databases daily. For additional safety:
- Enable point-in-time recovery
- Export regular snapshots to S3

### File Storage Backups
- Configure S3 versioning
- Set up lifecycle policies for old versions

## Scaling

### Horizontal Scaling
- Enable multiple instances for backend
- Use Redis for session sharing
- Configure load balancer

### Vertical Scaling
- Upgrade to higher tier plans as needed
- Monitor resource usage and adjust

## Security

### SSL/TLS
Render automatically provides SSL certificates for all services

### Security Headers
Add security headers in backend:
```python
# app/main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["seminar-platform-backend.onrender.com"]
)
```

### Rate Limiting
Implement rate limiting using Redis:
```python
# core/rate_limit.py
from fastapi import Request, HTTPException
import redis

redis_client = redis.from_url(REDIS_URL)

async def rate_limit(request: Request, limit: int = 100):
    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"
    
    current = redis_client.incr(key)
    if current == 1:
        redis_client.expire(key, 60)  # 1 minute window
    
    if current > limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
```

## CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_BACKEND_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```
