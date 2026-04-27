# Authentication System

## Authentication Flow
1. **Signup**: User fills registration form → Backend validates → Creates user → Sends verification email
2. **Login**: User enters credentials → Backend verifies → Returns JWT + refresh token
3. **Session Management**: JWT stored in httpOnly cookie + localStorage backup
4. **Token Refresh**: Automatic refresh using refresh token
5. **Logout**: Clear tokens + invalidate refresh token

## Auth UI Components

### Login Page Buttons
```tsx
// Login Page
<Button variant="default" type="submit">Login</Button>
<Button variant="ghost" onClick={handleForgotPassword}>Forgot Password?</Button>
<Button variant="link" onClick={navigateToSignup}>Create Account</Button>
<Button variant="outline" onClick={handleGoogleLogin}>Continue with Google</Button>
```

### Signup Page Buttons
```tsx
// Signup Page
<Button variant="default" type="submit">Create Account</Button>
<Button variant="ghost" onClick={navigateToLogin}>Already have an account? Login</Button>
<Button variant="outline" onClick={handleGoogleSignup}>Sign up with Google</Button>
```

### Header/Auth Buttons (Not Logged In)
```tsx
<Button variant="default" onClick={navigateToLogin}>Login</Button>
<Button variant="outline" onClick={navigateToSignup}>Sign Up</Button>
```

### Header/Auth Buttons (Logged In - Common)
```tsx
<Button variant="ghost" onClick={navigateToDashboard}>Dashboard</Button>
<Button variant="ghost" onClick={navigateToProfile}>Profile</Button>
<Button variant="destructive" onClick={handleLogout}>Logout</Button>
```

### Role-Specific Header Buttons

#### DEAN
```tsx
<Button variant="default" onClick={navigateToAdminPanel}>Admin Panel</Button>
<Button variant="outline" onClick={navigateToApprovals}>Approvals</Button>
```

#### COORDINATOR
```tsx
<Button variant="default" onClick={navigateToSchedule}>Schedule Seminar</Button>
<Button variant="outline" onClick={navigateToPolls}>Availability Polls</Button>
```

#### FACULTY
```tsx
<Button variant="default" onClick={navigateToMySeminars}>My Seminars</Button>
<Button variant="outline" onClick={navigateToFeedback}>Give Feedback</Button>
```

#### PHD_CANDIDATE
```tsx
<Button variant="default" onClick={navigateToSubmitPresentation}>Submit Presentation</Button>
<Button variant="outline" onClick={navigateToMyProgress}>My Progress</Button>
```

#### ADMIN
```tsx
<Button variant="default" onClick={navigateToUserManagement}>Users</Button>
<Button variant="outline" onClick={navigateToSettings}>Settings</Button>
```

### Dashboard Action Buttons

#### Seminar Actions
```tsx
<Button variant="default" onClick={handleCreateSeminar}>Create Seminar</Button>
<Button variant="outline" onClick={handleViewCalendar}>View Calendar</Button>
<Button variant="ghost" onClick={handleExport}>Export Schedule</Button>
```

#### Presentation Actions
```tsx
<Button variant="default" onClick={handleUpload}>Upload Presentation</Button>
<Button variant="outline" onClick={handleSubmitProgress}>Submit Progress Report</Button>
<Button variant="ghost" onClick={handleViewFeedback}>View Feedback</Button>
```

#### Feedback Actions
```tsx
<Button variant="default" onClick={handleSubmitPeerReview}>Submit Peer Review</Button>
<Button variant="outline" onClick={handleSubmitFacultyViva}>Submit Faculty Viva</Button>
```

## Backend Authentication Implementation

### JWT Token Structure
```python
# core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    expires_delta = timedelta(days=7)
    return create_access_token(data, expires_delta)
```

### Auth Router
```python
# api/v1/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from ...schemas.user import UserCreate, UserResponse, Token
from ...services.auth_service import AuthService

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, auth_service: AuthService = Depends()):
    return await auth_service.register(user_data)

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends()
):
    return await auth_service.authenticate(form_data.username, form_data.password)

@router.post("/refresh", response_model=Token)
async def refresh_token(token: str = Depends(oauth2_scheme)):
    # Refresh token logic
    pass

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    # Invalidate token logic
    pass
```

## Frontend Authentication Implementation

### Auth Store (Zustand)
```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const response = await authService.login(email, password);
        set({
          user: response.user,
          token: response.access_token,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      setUser: (user) => set({ user }),
    }),
    { name: 'auth-storage' }
  )
);
```

### Auth Service
```typescript
// services/authService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await axios.post(`${API_URL}/auth/login`, formData);
    return response.data;
  },

  async register(userData: RegisterData) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  },

  async logout() {
    await axios.post(`${API_URL}/auth/logout`);
  },

  async refreshToken() {
    const response = await axios.post(`${API_URL}/auth/refresh`);
    return response.data;
  },
};
```

### Auth Guard Component
```typescript
// components/auth/AuthGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};
```

### Protected Route
```typescript
// components/auth/ProtectedRoute.tsx
import { AuthGuard } from './AuthGuard';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <AuthGuard>{children}</AuthGuard>;
};
```
