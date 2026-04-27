# API Endpoints

## Authentication Endpoints
```
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/login             # User login
POST   /api/v1/auth/logout            # User logout
POST   /api/v1/auth/refresh           # Refresh JWT token
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset password
GET    /api/v1/auth/me                # Get current user
```

## User Endpoints
```
GET    /api/v1/users                  # List users (admin/coordinator)
GET    /api/v1/users/{id}             # Get user by ID
PUT    /api/v1/users/{id}             # Update user
DELETE /api/v1/users/{id}             # Delete user (admin)
GET    /api/v1/users/role/{role}      # Get users by role
PUT    /api/v1/users/{id}/role        # Update user role (admin)
```

## Seminar Endpoints
```
GET    /api/v1/seminars               # List all seminars
POST   /api/v1/seminars               # Create seminar (coordinator)
GET    /api/v1/seminars/{id}          # Get seminar details
PUT    /api/v1/seminars/{id}          # Update seminar
DELETE /api/v1/seminars/{id}          # Delete seminar
GET    /api/v1/seminars/upcoming      # Get upcoming seminars
GET    /api/v1/seminars/past          # Get past seminars
POST   /api/v1/seminars/{id}/approve  # Approve seminar (dean)
```

## Presentation Endpoints
```
GET    /api/v1/presentations          # List presentations
POST   /api/v1/presentations          # Submit presentation
GET    /api/v1/presentations/{id}     # Get presentation details
PUT    /api/v1/presentations/{id}     # Update presentation
DELETE /api/v1/presentations/{id}     # Delete presentation
POST   /api/v1/presentations/{id}/upload  # Upload presentation file
GET    /api/v1/presentations/{id}/download # Download presentation
GET    /api/v1/presentations/my        # Get my presentations
POST   /api/v1/presentations/{id}/submit-progress # Submit progress report
```

## Schedule Endpoints
```
GET    /api/v1/schedules              # Get schedule
POST   /api/v1/schedules              # Create schedule (coordinator)
GET    /api/v1/schedules/{id}         # Get schedule details
PUT    /api/v1/schedules/{id}         # Update schedule
DELETE /api/v1/schedules/{id}         # Delete schedule
GET    /api/v1/schedules/calendar     # Get calendar view
POST   /api/v1/availability/poll      # Create availability poll
POST   /api/v1/availability/respond   # Respond to poll
GET    /api/v1/availability/faculty   # Get faculty availability
```

## Feedback Endpoints
```
GET    /api/v1/feedback               # List feedback
POST   /api/v1/feedback               # Submit feedback
GET    /api/v1/feedback/{id}          # Get feedback details
PUT    /api/v1/feedback/{id}          # Update feedback
DELETE /api/v1/feedback/{id}          # Delete feedback
GET    /api/v1/feedback/presentations/{id}  # Feedback for presentation
GET    /api/v1/feedback/my            # Feedback I received
GET    /api/v1/feedback/my-given      # Feedback I gave
POST   /api/v1/feedback/peer          # Submit peer review
POST   /api/v1/feedback/faculty       # Submit faculty viva
```

## Progress Report Endpoints
```
GET    /api/v1/progress-reports       # List progress reports
POST   /api/v1/progress-reports       # Submit progress report
GET    /api/v1/progress-reports/{id}  # Get progress report details
PUT    /api/v1/progress-reports/{id}  # Update progress report
GET    /api/v1/progress-reports/my    # My progress reports
GET    /api/v1/progress-reports/student/{id}  # Student's progress
```

## Notification Endpoints
```
GET    /api/v1/notifications          # Get notifications
PUT    /api/v1/notifications/{id}/read  # Mark as read
POST   /api/v1/notifications/send     # Send notification (admin)
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

## Authentication Headers
```
Authorization: Bearer <access_token>
```

## Pagination
```
GET /api/v1/seminars?page=1&limit=10&sort=-created_at
```

## Filtering
```
GET /api/v1/seminars?status=SCHEDULED&date_from=2024-01-01&date_to=2024-12-31
```
