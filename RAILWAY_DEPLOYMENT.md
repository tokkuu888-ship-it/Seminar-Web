# Railway Deployment Guide - PhD Seminar Platform

## Prerequisites

- Railway account (https://railway.app)
- GitHub account with repository access
- Email service account (Gmail with App Password or SendGrid)

## Step 1: Create New Project on Railway

1. Go to https://railway.app
2. Click "New Project"
3. Click "Deploy from GitHub repo"
4. Select your repository: `tokkuu888-ship-it/Seminar-Web`
5. Click "Add Project"

## Step 2: Add PostgreSQL Database

1. In your Railway project, click "New Service"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway will automatically create a PostgreSQL database
5. Click on the database service to view connection details

## Step 3: Configure Backend Service

1. Click "New Service" in your Railway project
2. Select "GitHub Repo"
3. Select the same repository
4. Set root directory to: `backend`
5. Configure settings:
   - **Name**: `seminar-backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Step 4: Add Environment Variables to Backend

1. Click on the backend service
2. Go to "Variables" tab
3. Add the following variables:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=generate-a-strong-random-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@seminar-platform.com

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=us-east-1

REDIS_URL=
FRONTEND_URL=https://your-frontend-url.railway.app
```

**Important:** Use `${{Postgres.DATABASE_URL}}` to automatically link to your Railway PostgreSQL database.

## Step 5: Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Use the output for SECRET_KEY.

## Step 6: Set Up Gmail App Password

1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Create new app password for "Mail"
5. Copy the 16-character password for SMTP_PASSWORD

## Step 7: Deploy Backend

1. Click "Deploy" on the backend service
2. Wait for deployment to complete
3. Railway will automatically build and start the service
4. Click on the backend service to get the public URL

## Step 8: Run Database Migrations

### Option A: Via Railway Console
1. Click on backend service
2. Click "Console" tab
3. Click "New Console"
4. Run:
```bash
alembic upgrade head
```

### Option B: Via Railway Shell
1. Click on backend service
2. Click "Shell" button
3. Run:
```bash
alembic upgrade head
```

## Step 9: Configure Frontend Service

1. Click "New Service" in your Railway project
2. Select "GitHub Repo"
3. Select the same repository
4. Set root directory to: `frontend`
5. Configure settings:
   - **Name**: `seminar-frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`

## Step 10: Add Environment Variables to Frontend

1. Click on the frontend service
2. Go to "Variables" tab
3. Add:
```
VITE_API_URL=https://your-backend-url.railway.app/api/v1
VITE_APP_NAME=PhD Seminar Platform
```

Replace `your-backend-url` with your actual backend Railway URL.

## Step 11: Deploy Frontend

1. Click "Deploy" on the frontend service
2. Wait for deployment to complete
3. Click on the frontend service to get the public URL

## Step 12: Update Backend CORS

Update `backend/app/main.py` with your frontend URL:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy backend after this change.

## Step 13: Create Initial Admin User

Via API:
```bash
curl -X POST https://your-backend-url.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@seminar-platform.com",
    "password": "strong-password",
    "first_name": "Admin",
    "last_name": "User",
    "role": "ADMIN"
  }'
```

## Step 14: Test the Application

1. Visit your frontend URL
2. Should see login page
3. Register or login with admin credentials
4. Test functionality

## Railway Free Tier Limits

- **PostgreSQL**: 1GB storage
- **Apps**: 512MB RAM, 0.5 CPU
- **Egress**: 100GB/month
- **Builds**: 500 hours/month

## Scaling

When ready to scale:
1. Upgrade to paid plans for more resources
2. Add Redis for caching
3. Use CDN for static assets
4. Implement load balancing

## Troubleshooting

### Backend Fails to Start
- Check environment variables are set correctly
- Verify DATABASE_URL is linked to PostgreSQL service
- Check logs in Railway console

### Frontend Cannot Connect to Backend
- Verify CORS settings
- Check VITE_API_URL in frontend variables
- Ensure backend is running

### Database Connection Issues
- Verify PostgreSQL service is running
- Check DATABASE_URL format
- Ensure database is linked to backend

### Migration Issues
- Ensure Alembic is installed
- Check DATABASE_URL is accessible
- Run migrations manually via console

## Monitoring

Railway provides built-in monitoring:
- CPU usage
- Memory usage
- Network traffic
- Logs
- Metrics

Access these from each service's dashboard.

## Cost Estimation (Railway Free Tier)

- PostgreSQL: Free (1GB)
- Backend: Free (512MB RAM)
- Frontend: Free (512MB RAM)
- **Total**: Free (within limits)

## Support

For issues:
- Check Railway status page
- Review application logs
- Consult architecture documentation
