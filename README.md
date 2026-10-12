# StudyHub — Full-Stack Web Engineering Academic Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg)](https://www.sqlalchemy.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-orange.svg)](https://alembic.sqlalchemy.org/)
[![Pytest](https://img.shields.io/badge/Tests-Pytest%2020%2F20%20Pass-brightgreen.svg)]()
[![Vitest](https://img.shields.io/badge/Frontend-Vitest%20Pass-brightgreen.svg)]()

> **M.Tech Academic Capstone Project**  
> Centralized learning and academic collaboration platform built using React, Python FastAPI, SQLAlchemy ORM, Alembic, and PostgreSQL.

---

## 📖 Table of Contents
1. [Project Vision & Overview](#-project-vision--overview)
2. [Technology Stack](#-technology-stack)
3. [System Architecture](#-system-architecture)
4. [Demo Accounts for Academic Evaluation](#-demo-accounts-for-academic-evaluation)
5. [Quickstart & Local Setup](#-quickstart--local-setup)
6. [Database Migrations & Seeding](#-database-migrations--seeding)
7. [Running Automated Tests](#-running-automated-tests)
8. [API Documentation (OpenAPI/Swagger)](#-api-documentation-openapiswagger)
9. [Project Directory Layout](#-project-directory-layout)
10. [Academic Viva Readiness Guide](#-academic-viva-readiness-guide)

---

## 🎯 Project Vision & Overview

StudyHub provides students, faculty, and administrators with an integrated digital educational ecosystem:
- **Course Catalog & Filtering**: Searchable catalog with difficulty and category filters.
- **Student Dashboard**: Aggregated course enrollments, real-time lesson progress, and quiz history.
- **Curriculum & Learning Workspace**: Structured modules, lessons, notes, and downloadable references.
- **Assessments & Quizzes**: Timed multiple-choice quizzes with strict server-side grading and answer confidentiality.
- **Course Discussion Forum**: Threaded discussions, student replies, and instructor/admin moderation.
- **Instructor Studio**: Course curriculum authoring and quiz creation.
- **Platform Administration**: Platform metrics, user RBAC management, and course moderation.

---

## 🛠 Technology Stack

- **Frontend**: React 18, React Router v7, Axios, Lucide Icons, Vanilla CSS Design Token System.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, PyJWT, bcrypt.
- **Database & ORM**: PostgreSQL 15+, SQLAlchemy 2.0 ORM, Alembic database migrations.
- **Testing**: Pytest (20 backend unit/integration tests), Vitest & React Testing Library (frontend).

---

## 🏛 System Architecture

StudyHub follows a clean, three-tier decoupled architecture:

```
[ React SPA Client (Port 5173) ]
           │
           │  HTTPS / REST (JSON with Bearer JWT)
           ▼
[ FastAPI Application Server (Port 8000) ]
     ├── CORS & Auth Middleware
     ├── Pydantic Request/Response Validation
     ├── Role-Based Access Control (RBAC: Student, Instructor, Admin)
     └── SQLAlchemy 2.0 ORM Sessions
           │
           │  PostgreSQL Protocol (psycopg2)
           ▼
[ PostgreSQL Database: studyhub_db (Port 5432) ]
     ├── 18 Normalized Relations (3NF)
     ├── Foreign Key Cascades & Unique Constraints
     └── Alembic Schema Migrations
```

---

## 👥 Demo Accounts for Academic Evaluation

The database seed script initializes realistic accounts for each user role:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Student** | `student@studyhub.edu` | `Student@123` | Browse catalog, enroll, view lessons, complete progress, take quizzes, post in discussions. |
| **Student 2** | `student2@studyhub.edu` | `Student@123` | Additional student account to test multi-student enrollment and forum replies. |
| **Instructor** | `instructor@studyhub.edu` | `Instructor@123` | Author courses, organize modules/lessons, create quizzes with answer keys, review enrollments. |
| **Administrator** | `admin@studyhub.edu` | `Admin@123` | View platform statistics, manage user roles, deactivate accounts, moderate course publishing. |

*(Note: The login page includes convenient one-click presets for rapid demonstration during viva evaluation).*

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ and npm
- PostgreSQL 14+ running locally

### 2. Clone and Configure Environment
```bash
git clone <repository_url>
cd StudyHub-FSWE

# Create PostgreSQL database
createdb studyhub_db

# Configure backend environment variables
cp .env.example backend/.env
```

### 3. Backend Setup
```bash
# Create Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Run Alembic database migrations
alembic upgrade head

# Seed realistic demonstration data
python -m app.seed

# Start FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend will now be live at `http://127.0.0.1:8000` with interactive docs at `http://127.0.0.1:8000/docs`.*

### 4. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*The frontend will now be accessible at `http://localhost:5173`.*

---

## 🗄 Database Migrations & Seeding

Database tables are version-controlled with Alembic:
```bash
# Generate a new migration after editing SQLAlchemy models
alembic revision --autogenerate -m "Add new column or table"

# Apply pending migrations
alembic upgrade head

# Rollback migration if necessary
alembic downgrade -1

# Seed sample data
python -m app.seed
```

---

## 🧪 Running Automated Tests

### Backend Test Suite (Pytest)
```bash
cd backend
source ../.venv/bin/activate
pytest -v
```
**Results**: 20/20 tests passing (Health check, password hashing, JWT auth, duplicate enrollment prevention, role authorization, quiz answer confidentiality, server-side grading, and admin protection).

### Frontend Test Suite (Vitest)
```bash
cd frontend
npm test
```
**Results**: All Vitest test suites passing (App routing, navbar brand, credentials banner, and component rendering).

---

## 📚 API Documentation (OpenAPI/Swagger)

With the backend running, visit:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 📂 Project Directory Layout

```
StudyHub-FSWE/
├── backend/
│   ├── app/
│   │   ├── api/             # REST resource endpoints (auth, courses, quizzes, etc.)
│   │   ├── models/          # SQLAlchemy ORM relational models (18 tables)
│   │   ├── schemas/         # Pydantic v2 request/response validation schemas
│   │   ├── services/        # Business logic (bcrypt hashing, JWT handling)
│   │   ├── config.py        # Pydantic Settings configuration
│   │   ├── database.py      # Engine, SessionLocal, get_db dependency
│   │   ├── main.py          # FastAPI application entrypoint & CORS middleware
│   │   └── seed.py          # Database seeder with realistic academic courses
│   ├── alembic/             # Alembic migration scripts and version history
│   ├── tests/               # Pytest automated test suite (20 tests)
│   ├── alembic.ini          # Alembic configuration
│   ├── requirements.txt     # Backend Python dependencies
│   ├── pytest.ini           # Pytest settings
│   └── .env                 # Local backend environment variables
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with JWT interceptor
│   │   ├── components/      # Navbar, Footer, ProtectedRoute, StatCard, Spinner
│   │   ├── context/         # AuthContext state provider
│   │   ├── pages/           # Landing, Catalog, Dashboard, Workspace, Quiz, Admin
│   │   ├── tests/           # Vitest and React Testing Library tests
│   │   ├── App.jsx          # Route declarations
│   │   ├── index.css        # Vanilla CSS Design System and tokens
│   │   └── main.jsx         # React DOM root entrypoint
│   ├── package.json         # Frontend dependencies and scripts
│   └── vite.config.js       # Vite and Vitest configuration
├── docs/
│   ├── ARCHITECTURE.md      # Detailed system architecture and sequence diagrams
│   ├── DATABASE_SCHEMA.md   # Relational ER diagram, 3NF analysis, constraints
│   ├── API_DOCUMENTATION.md # Complete REST API reference
│   └── VIVA_PREPARATION.md  # Top 25 Viva Voce questions, answers, and demo outline
├── .gitignore
├── .env.example
└── README.md
```

---

## 🎓 Academic Viva Readiness Guide

For evaluation preparation, consult the dedicated documentation in [`docs/VIVA_PREPARATION.md`](docs/VIVA_PREPARATION.md), which includes:
- **Presentation Outline**: A concise 3-minute oral defense pitch.
- **Top 25 Viva Questions & Answers**: Thorough academic explanations covering ORMs, normalization, JWTs, `bcrypt`, CORS, XSS mitigation, and database indexes.
- **Demonstration Walkthrough**: Step-by-step instructions for demonstrating Student, Instructor, and Administrator workflows live to the viva committee.
