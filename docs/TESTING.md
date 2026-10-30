# 🧪 StudyHub Quality Assurance & Testing Guide

> **Test Suites**: Pytest (Backend) & Vitest + React Testing Library (Frontend)

---

## 1. Test Architecture Overview

StudyHub employs a multi-tiered test automation strategy:
1. **Unit Tests**: Password hashing, token generation, isolated component rendering.
2. **Integration Tests**: API endpoint routing, RBAC privilege enforcement, database transactions, silent refresh flow.
3. **Security Audits**: Payload size limiting, security header inspection, rate limit verification.
4. **CI/CD Quality Gates**: Automated execution on every commit and pull request via GitHub Actions.

---

## 2. Running Backend Tests (Pytest)

The backend test suite utilizes an isolated test database with deterministic seed data, allowing all 31 tests to run safely in seconds without requiring an external PostgreSQL instance.

```bash
cd backend

# Execute all tests
python -m pytest tests/

# Execute with detailed test verbosity
python -m pytest -v tests/

# Execute with code coverage report
python -m pytest --cov=app --cov-report=term-missing tests/
```

### Backend Test Coverage Breakdown (31 Tests):
- `tests/test_auth.py` (10 tests): Login, password hashing, invalid credentials, password policy rejection, duplicate registration, user profile, silent refresh token rotation, logout revocation.
- `tests/test_admin.py` (4 tests): Admin stats RBAC, student/instructor access restriction, user role & status modification.
- `tests/test_courses.py` (6 tests): Catalog listing, full-text search, instructor course creation, student creation blocking, duplicate enrollment prevention, enrollment & unenrollment.
- `tests/test_progress.py` (1 test): Lesson progress toggle, completion calculation.
- `tests/test_quizzes.py` (2 tests): Question option answer confidentiality, server-side grading.
- `tests/test_security.py` (4 tests): Security headers, correlation request ID uniqueness, 10MB payload size limit enforcement, CORS preflight verification.
- `tests/test_rbac.py` (4 tests): Comprehensive cross-role permission checks.

---

## 3. Running Frontend Tests (Vitest)

Frontend tests evaluate React 19 components, Error Boundaries, and App routing:

```bash
cd frontend

# Run tests in single-run mode
npx vitest run

# Run tests in interactive watch mode
npm test

# Verify production Vite build and chunk splitting
npm run build
```
