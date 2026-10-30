# StudyHub — Full-Stack Web Engineering Academic Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg)](https://www.sqlalchemy.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-0C2340.svg)](https://razorpay.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Pytest](https://img.shields.io/badge/Tests-Pytest%2027%2F27%20Pass-brightgreen.svg)]()
[![Vitest](https://img.shields.io/badge/Frontend-Vitest%207%2F7%20Pass-brightgreen.svg)]()

> **Production-Ready Academic & Enterprise Learning Management Platform**  
> Built with React, Python FastAPI, SQLAlchemy ORM, PostgreSQL, Razorpay Payment Gateway, SMTP Email Engine, and JWT Authentication with Refresh Tokens.

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

## 🎯 Project Vision & Key Capabilities

StudyHub provides students, faculty, and administrators with an integrated digital educational ecosystem:
- **💳 Razorpay Payment Gateway**: Seamless course purchasing with backend order creation (`/create-order`), cryptographic HMAC-SHA256 signature verification (`/verify`), course pricing, and student billing receipts history. Includes automated sandbox fallback for zero-setup local testing.
- **✉️ Automated Email Notification Engine**: Asynchronous SMTP dispatch (`BackgroundTasks`) with responsive, branded HTML templates for:
  - Welcome email on registration.
  - Course enrollment confirmation with Razorpay transaction receipts.
  - Quiz completion results with score breakdown and pass/fail indicators.
  - Course curriculum update alerts to all enrolled students when new lessons are added.
  - Secure signed password recovery emails.
  *(Gracefully logs formatted email previews to console if live SMTP credentials are not configured).*
- **🔐 Enterprise JWT Authentication & Security**:
  - Short-lived Access Tokens (60 min) + 7-day Refresh Tokens (`/api/v1/auth/refresh`).
  - Axios response interceptor for automatic, seamless token rotation with request retry queue.
  - Time-limited signed Password Reset Tokens (15 min) with frontend reset screens.
  - Password hashing with salted `bcrypt` and strict role-based access control (Student, Instructor, Admin).
- **Course Catalog & Filtering**: Searchable catalog with difficulty, price, and category filters.
- **Student Dashboard**: Aggregated enrollments, lesson progress, quiz attempts, and payment receipts.
- **Curriculum & Learning Workspace**: Structured modules, lessons, notes, and downloadable references.
- **Assessments & Quizzes**: Timed multiple-choice quizzes with strict server-side grading and answer confidentiality.
- **Course Discussion Forum**: Threaded discussions, student replies, and instructor/admin moderation.
- **Instructor Studio**: Course curriculum authoring and quiz creation.
- **Platform Administration**: Platform metrics, user RBAC management, and course moderation.

---

## 🛠 Technology Stack

- **Frontend**: React 18, React Router v7, Axios with JWT Auto-Refresh Interceptors, Lucide Icons, Vanilla CSS Design System.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, PyJWT, bcrypt, Razorpay SDK, standard `smtplib` & `email.mime`.
- **Database & ORM**: PostgreSQL 15+, SQLAlchemy 2.0 ORM (19 normalized relations), Alembic migrations.
- **Payments**: Razorpay Standard Checkout SDK + Webhooks & SHA256 Signature Verification.
- **Testing**: Pytest (27 backend unit/integration tests), Vitest & React Testing Library (7 frontend component tests).
- **Deployment**: Docker, Multi-Stage Nginx Frontend, Docker Compose.

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
**Results**: **27/27 tests passing 100%**:
- Health check & database connection
- Password hashing & verification with salted bcrypt
- JWT Authentication (Access tokens, 7-day refresh tokens, token rotation)
- Time-limited signed Password Reset tokens (15 min expiry)
- Duplicate enrollment prevention & role authorization
- Razorpay order creation (`/api/v1/payments/create-order`)
- Cryptographic HMAC-SHA256 signature verification (`/api/v1/payments/verify`)
- Student billing receipts and transaction history (`/api/v1/payments/my-transactions`)
- Quiz answer confidentiality & server-side grading
- Admin role route protection

### Frontend Test Suite (Vitest)
```bash
cd frontend
npm test
```
**Results**: **7/7 tests passing 100%** (App routing, navbar brand, credentials banner, ForgotPasswordPage form, and component rendering).

---

## 🚢 Production Deployment Guide

StudyHub is production-ready and can be deployed via **Docker Compose** (recommended) or as standalone services on any cloud provider (AWS, GCP, DigitalOcean, Render, Railway, or VPS).

### Method 1: Turnkey Docker Deployment (Recommended)

1. **Clone repository and configure environment variables**:
   ```bash
   git clone <repo-url>
   cd StudyHub-FSWE
   cp .env.example .env
   # Edit .env to set your SECRET_KEY, RAZORPAY keys, and SMTP credentials
   ```

2. **Launch all services with Docker Compose**:
   ```bash
   docker compose up --build -d
   ```
   This automatically provisions:
   - **PostgreSQL 15 Container** (`studyhub_db`) with volume persistence and health checks.
   - **FastAPI Backend Container** (`studyhub_backend`) on port `8000`.
   - **Nginx Frontend Container** (`studyhub_frontend`) on port `80` with client-side SPA routing and reverse-proxying.

3. **Run database seed script inside the backend container**:
   ```bash
   docker compose exec backend python -m app.seed
   ```
   *Your app is now live at `http://localhost` (or your domain/IP).*

---

### Method 2: Manual Cloud VPS Deployment (Ubuntu / Debian)

#### 1. Backend Service (Systemd + Gunicorn/Uvicorn)
1. Install Python 3.12 and PostgreSQL:
   ```bash
   sudo apt update && sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib nginx
   ```
2. Set up virtual environment and install dependencies:
   ```bash
   python3 -m venv /var/www/studyhub/backend/.venv
   source /var/www/studyhub/backend/.venv/bin/activate
   pip install -r /var/www/studyhub/backend/requirements.txt
   ```
3. Configure `systemd` service (`/etc/systemd/system/studyhub-backend.service`):
   ```ini
   [Unit]
   Description=StudyHub FastAPI Backend
   After=network.target postgresql.service

   [Service]
   User=www-data
   WorkingDirectory=/var/www/studyhub/backend
   EnvironmentFile=/var/www/studyhub/backend/.env
   ExecStart=/var/www/studyhub/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
4. Enable and start:
   ```bash
   sudo systemctl daemon-reload && sudo systemctl enable --now studyhub-backend
   ```

#### 2. Frontend Production Build & Nginx
1. Build frontend assets:
   ```bash
   cd /var/www/studyhub/frontend
   npm install && npm run build
   ```
2. Configure Nginx (`/etc/nginx/sites-available/studyhub`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           root /var/www/studyhub/frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:8000/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Enable SSL with Certbot:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

### 🔑 Production Checklist & Configuration

| Service | Setting | Description |
| :--- | :--- | :--- |
| **Razorpay** | `RAZORPAY_KEY_ID` | Replace `rzp_test_...` with your live key `rzp_live_...` from the [Razorpay Dashboard](https://dashboard.razorpay.com/#/app/keys). |
| **Razorpay** | `RAZORPAY_KEY_SECRET` | Your live secret key from Razorpay Dashboard. |
| **Email** | `EMAILS_ENABLED` | Set to `True` to enable real outbound email delivery. |
| **Email** | `SMTP_USER` & `SMTP_PASSWORD` | Your SMTP provider credentials (e.g., Gmail App Password or SendGrid API Key). |
| **Security** | `SECRET_KEY` | Generate a cryptographically secure random string: `openssl rand -hex 32`. |
| **CORS** | `CORS_ORIGINS` | Restrict to your production domain (e.g. `https://studyhub.edu`). |

---

## 📚 API Documentation (OpenAPI/Swagger)

With the backend running, visit:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

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
