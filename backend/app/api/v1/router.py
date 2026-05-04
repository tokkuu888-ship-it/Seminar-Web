from fastapi import APIRouter
from .auth.router import router as auth_router
from .users.router import router as users_router
from .seminars.router import router as seminars_router
from .availability.router import router as availability_router
from .dashboard.router import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(seminars_router, prefix="/seminars", tags=["Seminars"])
api_router.include_router(availability_router, prefix="", tags=["Availability"])
api_router.include_router(dashboard_router, prefix="", tags=["Dashboard"])


@api_router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
