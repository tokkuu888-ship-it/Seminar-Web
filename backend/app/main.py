from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.v1.router import api_router

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
