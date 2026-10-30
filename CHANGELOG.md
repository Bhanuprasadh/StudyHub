# 📋 Changelog

All notable changes to the StudyHub Academic Learning Platform are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-30 — Production-Grade Architecture Upgrade

### 🚀 Added
- **Refresh Token Rotation System**: In-memory access token (15m) + HttpOnly SameSite cookie refresh token (7d) with automatic rotation, family tracking, and breach reuse detection.
- **Account Lockout & Password Security**: Failed login counter with 15-minute lockout after 5 consecutive failures, plus regex password complexity validation.
- **Rate Limiting**: Integrated `slowapi` rate limiting with Redis/in-memory token bucket backend (5/min auth, 60/min API).
- **Security Headers & Protection**: Added `SecurityHeadersMiddleware` (HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy).
- **Request Size Limiter**: Added `RequestSizeLimitMiddleware` rejecting requests exceeding 10MB with 413 Payload Too Large.
- **Request ID Tracking**: Added unique `X-Request-ID` correlation header to all requests and internal error logs.
- **Database Connection Pooling**: Added pool size tuning (pool_size=10, max_overflow=20, pool_timeout=30s, pool_recycle=1800s).
- **Alembic Database Migration**: Added `phase2_security_and_indexes` creating `refresh_tokens` table and composite indexes.
- **Containerization**: Multi-stage production `backend/Dockerfile` (non-root user), `frontend/Dockerfile` (Vite build + Nginx), `docker-compose.yml`, and `docker-compose.prod.yml`.
- **CI/CD Pipelines**: Added GitHub Actions workflows for automated backend/frontend testing, linting, and Docker validation.
- **Automated Backup & Restore**: Added `scripts/backup.sh`, `scripts/restore.sh`, `scripts/backup.ps1`, `scripts/restore.ps1`.
- **React Error Boundary & Code Splitting**: Added `<ErrorBoundary>` fallback UI and `React.lazy` route splitting for all 14 pages.
- **Mobile Navigation Drawer**: Responsive mobile navbar with hamburger drawer and outside-click notification dropdown dismissal.
- **Expanded Test Suites**: 31 backend Pytest tests and 5 frontend Vitest tests covering RBAC, security headers, token rotation, and error boundaries.

### ⚡ Optimized
- **N+1 Query Elimination**: Converted per-row loops in `get_courses`, `get_student_dashboard`, `get_instructor_dashboard`, `get_admin_courses`, and `get_quizzes` into bulk joined and grouped SQL aggregations.
- **Python 3.12 Timezone Compliance**: Replaced deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)` across all models and services.
- **Frontend Bundle Size**: Chunked production bundle into per-page lazy bundles with gzip compression under 3KB per page.

---

## [1.0.0] - 2026-10-29 — Initial Academic Release
- Initial release featuring FastAPI REST API, React 19 SPA, 18 PostgreSQL tables, and basic JWT authentication.
