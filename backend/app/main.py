import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import check_db_health
from app.api import (
    auth, users, categories, courses, modules, lessons,
    enrollments, progress, quizzes, discussions, bookmarks, notifications, admin
)

# ── Structured logging setup ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s | req_id=%(request_id)s %(message)s"
    if False else "%(asctime)s [%(levelname)s] %(name)s %(message)s",
)
logger = logging.getLogger("studyhub")


# ── Request ID Middleware ─────────────────────────────────────────────────────
class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attaches a UUID to each request for log correlation."""
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


# ── Security Headers Middleware ───────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds production-grade HTTP security headers to every response."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response


# ── Request Size Limit Middleware ─────────────────────────────────────────────
class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Rejects request bodies larger than max_bytes to prevent DoS via large payloads."""
    def __init__(self, app, max_bytes: int = 10 * 1024 * 1024):  # 10 MB
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_bytes:
            return JSONResponse(
                status_code=413,
                content={"error": {"code": "REQUEST_TOO_LARGE", "message": "Request body too large (max 10 MB)"}},
            )
        return await call_next(request)


# ── FastAPI App ───────────────────────────────────────────────────────────────
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from app.limiter import limiter

app = FastAPI(
    title="StudyHub API",
    description="Full-Stack Web Engineering Learning & Academic Collaboration Platform API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware registration order matters — outermost wraps all inner
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(RequestIDMiddleware)

# CORS — restricted to known origins and explicit methods
origins = settings.cors_origin_list
for default_origin in ["http://localhost:5173", "http://127.0.0.1:5173"]:
    if default_origin not in origins:
        origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
)


# ── Global Exception Handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Log internal errors with full trace; return sanitized response to clients."""
    req_id = getattr(request.state, "request_id", "unknown")
    logger.exception(f"Unhandled exception | request_id={req_id} | path={request.url.path}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again.",
                "request_id": req_id,
            }
        },
    )


# ── Health Endpoints ──────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    """Liveness probe — confirms the process is running."""
    return {
        "status": "healthy",
        "service": "StudyHub API",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health/ready", tags=["Health"])
def readiness_check():
    """Readiness probe — confirms the database is reachable."""
    db_ok = check_db_health()
    if not db_ok:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "unreachable",
                "message": "Database connection failed",
            },
        )
    return {
        "status": "ready",
        "database": "connected",
    }


# ── API v1 Routers ────────────────────────────────────────────────────────────
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
app.include_router(admin.router, prefix=api_v1_prefix)
