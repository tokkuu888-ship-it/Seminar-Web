# Frontend Architecture

## Technology Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Calendar**: React Big Calendar
- **Rich Text Editor**: Tiptap

## Frontend File Structure
```
frontend/
├── public/
│   ├── favicon.ico
│   └── assets/
│
├── src/
│   ├── main.tsx                # Application entry
│   ├── App.tsx                 # Root component
│   ├── index.css
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── AuthGuard.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── seminar/
│   │   │   ├── SeminarCard.tsx
│   │   │   ├── SeminarList.tsx
│   │   │   ├── SeminarDetail.tsx
│   │   │   ├── SeminarForm.tsx
│   │   │   └── SeminarCalendar.tsx
│   │   │
│   │   ├── presentation/
│   │   │   ├── PresentationUpload.tsx
│   │   │   ├── PresentationViewer.tsx
│   │   │   ├── PresentationTimer.tsx
│   │   │   └── PhaseIndicator.tsx
│   │   │
│   │   ├── feedback/
│   │   │   ├── FeedbackForm.tsx
│   │   │   ├── FeedbackList.tsx
│   │   │   ├── PeerReview.tsx
│   │   │   └── FacultyViva.tsx
│   │   │
│   │   ├── schedule/
│   │   │   ├── AvailabilityPoll.tsx
│   │   │   ├── ScheduleGrid.tsx
│   │   │   ├── TimeSlotPicker.tsx
│   │   │   └── ConflictDetector.tsx
│   │   │
│   │   ├── progress/
│   │   │   ├── ProgressReportForm.tsx
│   │   │   ├── ProgressTimeline.tsx
│   │   │   ├── MilestoneTracker.tsx
│   │   │   └── DashboardCharts.tsx
│   │   │
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── FileUpload.tsx
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DeanDashboard.tsx
│   │   │   ├── CoordinatorDashboard.tsx
│   │   │   ├── FacultyDashboard.tsx
│   │   │   └── StudentDashboard.tsx
│   │   │
│   │   ├── seminars/
│   │   │   ├── SeminarList.tsx
│   │   │   ├── SeminarCreate.tsx
│   │   │   ├── SeminarDetail.tsx
│   │   │   └── MyPresentations.tsx
│   │   │
│   │   ├── schedule/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── Availability.tsx
│   │   │   └── UpcomingSeminars.tsx
│   │   │
│   │   ├── progress/
│   │   │   ├── MyProgress.tsx
│   │   │   ├── SubmitReport.tsx
│   │   │   └── ProgressHistory.tsx
│   │   │
│   │   ├── feedback/
│   │   │   ├── GiveFeedback.tsx
│   │   │   ├── ViewFeedback.tsx
│   │   │   └── FeedbackAnalytics.tsx
│   │   │
│   │   └── admin/
│   │       ├── UserManagement.tsx
│   │       ├── RoleManagement.tsx
│   │       ├── SystemSettings.tsx
│   │       └── AuditLogs.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSeminars.ts
│   │   ├── usePresentations.ts
│   │   ├── useSchedule.ts
│   │   ├── useFeedback.ts
│   │   └── useProgress.ts
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── seminarStore.ts
│   │   ├── scheduleStore.ts
│   │   └── uiStore.ts
│   │
│   ├── services/
│   │   ├── api.ts               # Axios instance
│   │   ├── authService.ts
│   │   ├── seminarService.ts
│   │   ├── scheduleService.ts
│   │   ├── feedbackService.ts
│   │   └── fileService.ts
│   │
│   ├── types/
│   │   ├── user.ts
│   │   ├── seminar.ts
│   │   ├── presentation.ts
│   │   ├── schedule.ts
│   │   └── feedback.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   └── config/
│       └── api.config.ts
│
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── Dockerfile
├── render.yaml
└── README.md
```

## Frontend Libraries (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.3",
    "axios": "^1.6.5",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "lucide-react": "^0.309.0",
    "recharts": "^2.10.3",
    "react-big-calendar": "^1.8.5",
    "date-fns": "^3.3.1",
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "class-variance-authority": "^0.7.0",
    "cmdk": "^0.2.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-select": "^2.0.0",
    "sonner": "^1.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.17"
  }
}
```

## Frontend Environment Variables (.env)
```bash
VITE_API_URL=https://your-backend.onrender.com/api/v1
VITE_APP_NAME=PhD Seminar Platform
```

## Frontend Dockerfile
```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
