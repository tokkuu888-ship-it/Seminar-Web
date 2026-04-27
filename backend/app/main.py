import os
print("🚀 App is starting...")
print("PYTHONPATH:", os.environ.get("PYTHONPATH", "not set"))
print("Current directory:", os.getcwd())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.v1.router import api_router

print("✅ Imports successful")
print("✅ Settings loaded")
print("DATABASE_URL set:", bool(settings.DATABASE_URL))
print("SECRET_KEY set:", bool(settings.SECRET_KEY))
print("FRONTEND_URL:", settings.FRONTEND_URL)

app = FastAPI(
    title="PhD Seminar Platform",
    description="Platform for managing PhD seminar presentations and progress monitoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "PhD Seminar Platform API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
