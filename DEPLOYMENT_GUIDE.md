# Deployment Guide - PhD Seminar Platform

## Prerequisites

- Render account (https://render.com)
- GitHub account with repository access
- PostgreSQL database (can be created on Render)
- Email service account (Gmail with App Password or SendGrid)
- AWS S3 account (for file storage, optional)

## Step 1: Set Up PostgreSQL Database

### Option A: Render PostgreSQL (Recommended)
1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Name: `seminar-platform-db`
4. Database: `seminar_platform`
5. User: `seminar_user`
6. Region: Choose closest to your users
7. Click "Create Database"
8. Copy the **Internal Database URL** (format: `postgresql://seminar_user:password@host:5432/seminar_platform`)

### Option B: External PostgreSQL
If using external PostgreSQL, ensure you have:
- Database URL
- Host, port, username, password

## Step 2: Configure Backend Environment Variables

### Update backend/.env
```bash
DATABASE_URL=postgresql://seminar_user:YOUR_PASSWORD@YOUR_HOST:5432/seminar_platform
SECRET_KEY=generate-a-strong-random-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@seminar-platform.com

AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=seminar-platform
AWS_REGION=us-east-1

REDIS_URL=redis://localhost:6379/0

FRONTEND_URL=https://your-frontend-url.onrender.com
```

### Generate Secret Key
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Set Up Gmail App Password (for email)
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Create new app password for "Mail"
5. Copy the 16-character password

## Step 3: Deploy Backend to Render

### Connect Repository
1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select root directory: `backend`
5. Name: `seminar-platform-backend`

### Configure Service
- **Runtime**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Add Environment Variables
Add these in Render Dashboard:
```
DATABASE_URL=your-postgresql-url
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@seminar-platform.com
FRONTEND_URL=https://seminar-platform-frontend.onrender.com
```

### Create Redis Instance
1. Go to Render Dashboard
2. Click "New" → "Redis"
3. Name: `seminar-platform-redis`
4. Copy the Redis URL

### Update Backend Service
Add Redis URL to backend environment variables:
```
REDIS_URL=your-redis-url
```

### Deploy
Click "Create Web Service" and wait for deployment.

### Test Backend
Visit: `https://seminar-platform-backend.onrender.com/health`
Should return: `{"status": "healthy"}`

## Step 4: Configure Frontend Environment Variables

### Update frontend/.env
```bash
VITE_API_URL=https://seminar-platform-backend.onrender.com/api/v1
VITE_APP_NAME=PhD Seminar Platform
```

## Step 5: Deploy Frontend to Render

### Connect Repository
1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select root directory: `frontend`
5. Name: `seminar-platform-frontend`

### Configure Service
- **Runtime**: Node
- **Build Command**: `npm run build`
- **Start Command**: `npm run preview`

### Add Environment Variables
```
VITE_API_URL=https://seminar-platform-backend.onrender.com/api/v1
VITE_APP_NAME=PhD Seminar Platform
```

### Deploy
Click "Create Web Service" and wait for deployment.

### Test Frontend
Visit: `https://seminar-platform-frontend.onrender.com`
Should show the login page.

## Step 6: Run Database Migrations

### Option A: Via Render Shell
1. Go to backend service on Render
2. Click "Shell" tab
3. Run:
```bash
alembic upgrade head
```

### Option B: Locally Before Deployment
```bash
cd backend
alembic upgrade head
```

## Step 7: Create Initial Admin User

### Via API
```bash
curl -X POST https://seminar-platform-backend.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@seminar-platform.com",
    "password": "strong-password",
    "first_name": "Admin",
    "last_name": "User",
    "role": "ADMIN"
  }'
```

## Step 8: Configure CORS (if needed)

Update backend/app/main.py if frontend URL changes:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seminar-platform-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step 9: Set Up Custom Domain (Optional)

### Backend
1. Go to backend service → Settings → Custom Domains
2. Add your domain (e.g., `api.seminar-platform.com`)
3. Update DNS records as instructed by Render

### Frontend
1. Go to frontend service → Settings → Custom Domains
2. Add your domain (e.g., `seminar-platform.com`)
3. Update DNS records as instructed by Render

## Step 10: Monitoring and Logs

### View Logs
- Backend: Service → Logs
- Frontend: Service → Logs

### Set Up Alerts
1. Go to service → Metrics
2. Configure alerts for:
   - Response time > 1s
   - Error rate > 5%
   - CPU usage > 80%

## Troubleshooting

### Backend Fails to Start
- Check environment variables are set correctly
- Verify database connection string
- Check logs for specific error messages

### Frontend Cannot Connect to Backend
- Verify CORS settings
- Check API_URL in frontend .env
- Ensure backend is running

### Database Connection Issues
- Verify DATABASE_URL format
- Check database is accessible
- Ensure database user has correct permissions

### Email Not Sending
- Verify SMTP credentials
- Check Gmail app password is correct
- Ensure SMTP host and port are correct

## Security Checklist

- [ ] Change SECRET_KEY from default
- [ ] Use strong passwords for database
- [ ] Enable SSL/TLS for all connections
- [ ] Set up rate limiting
- [ ] Enable 2FA for admin accounts
- [ ] Regularly update dependencies
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable audit logging

## Cost Estimation (Render)

- PostgreSQL: $7/month (Starter)
- Redis: $0/month (Free tier)
- Backend: $7/month (Starter)
- Frontend: $7/month (Starter)
- **Total**: ~$21/month

## Scaling

When ready to scale:
1. Upgrade database plan
2. Add multiple backend instances
3. Enable CDN for static assets
4. Use load balancer
5. Implement caching strategies

## Support

For issues:
- Check Render status page
- Review application logs
- Consult architecture documentation
- Check GitHub issues
