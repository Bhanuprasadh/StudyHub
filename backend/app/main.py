from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import Base, engine
import app.models  # Ensures all models (including Payment) are registered
from app.api import (
    auth, users, categories, courses, modules, lessons,
    enrollments, progress, quizzes, discussions, bookmarks, notifications, admin, payments
)

# Initialize database schema tables if not exist
Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    from sqlalchemy import text
    try:
        conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;"))
        conn.commit()
    except Exception:
        pass

app = FastAPI(
    title="StudyHub API",
    description="Full-Stack Web Engineering Learning & Academic Collaboration Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = settings.cors_origin_list
if "http://localhost:5173" not in origins:
    origins.append("http://localhost:5173")
if "http://127.0.0.1:5173" not in origins:
    origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service availability."""
    return {
        "status": "healthy",
        "service": "StudyHub API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


# Include API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(users.router, prefix=api_v1_prefix)
app.include_router(categories.router, prefix=api_v1_prefix)
app.include_router(courses.router, prefix=api_v1_prefix)
app.include_router(modules.router, prefix=api_v1_prefix)
app.include_router(lessons.router, prefix=api_v1_prefix)
app.include_router(enrollments.router, prefix=api_v1_prefix)
app.include_router(progress.router, prefix=api_v1_prefix)
app.include_router(quizzes.router, prefix=api_v1_prefix)
app.include_router(discussions.router, prefix=api_v1_prefix)
app.include_router(bookmarks.router, prefix=api_v1_prefix)
app.include_router(notifications.router, prefix=api_v1_prefix)
app.include_router(payments.router, prefix=api_v1_prefix)
app.include_router(admin.router, prefix=api_v1_prefix)

