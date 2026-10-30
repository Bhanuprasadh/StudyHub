# 🚀 StudyHub Deployment & Operations Manual

> **Scope**: Local Development, Staging, and Production Docker Orchestration

---

## 1. Prerequisites

- **Docker**: Engine version 24.0+ and Compose v2.20+
- **Host Specs**: Minimum 2 CPU cores, 4GB RAM, 10GB disk space
- **Ports**: 80 (HTTP), 443 (HTTPS), 3000 (Local Dev Frontend), 8000 (Backend API), 5432 (PostgreSQL), 6379 (Redis)

---

## 2. Quickstart: Local Docker Deployment

Run the complete multi-service stack (PostgreSQL, Redis, FastAPI, React/Nginx) with a single command:

```bash
# 1. Clone repository
git clone https://github.com/Bhanuprasadh/StudyHub.git
cd StudyHub

# 2. Copy and configure development environment
cp env.example .env

# 3. Spin up full stack
docker compose up -d --build

# 4. View running containers and health checks
docker compose ps
```

Access points:
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Interactive ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 3. Database Migrations & Initial Seed Data

To apply the latest Alembic schema migrations and populate demo accounts:

```bash
# Execute Alembic migrations
docker compose exec backend alembic upgrade head

# Seed demo users, courses, lessons, and quizzes
docker compose exec backend python app/seed.py
```

### Pre-configured Academic Demo Credentials

| Role | Email | Password | Access Privileges |
|:---|:---|:---|:---|
| **Administrator** | `admin@studyhub.edu` | `Admin@123` | Full system audit, user role management, system stats |
| **Instructor** | `instructor@studyhub.edu` | `Instructor@123` | Course creation, curriculum authoring, quiz management |
| **Student 1** | `student@studyhub.edu` | `Student@123` | Enrolled in Course 1, quiz attempts, progress tracking |
| **Student 2** | `student2@studyhub.edu` | `Student@123` | Clean student account for enrollment testing |

---

## 4. Production Deployment Orchestration

In production environments, apply the hardened production overrides:

```bash
# Launch with production configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Production Optimizations Applied:
1. **Host Isolation**: Database and Redis ports are not exposed directly to the public network.
2. **Resource Constraints**: Hard CPU limits (2.0 cores backend, 1.0 core redis, 2.0 cores DB) and memory limits (1GB backend, 512MB redis, 2GB DB).
3. **ASGI Workers**: Uvicorn runs with 4 concurrent asynchronous worker processes.
4. **Log Rotation**: Automated JSON log rotation with a 50MB ceiling and 5 retention files to prevent disk exhaustion.
5. **Cookie Security**: `COOKIE_SECURE=true` forces HTTPS-only cookie transmission.

---

## 5. Maintenance Commands

```bash
# Tail live backend logs
docker compose logs -f backend

# Stop all services gracefully
docker compose down

# Stop and wipe volume state (DANGER: destroys database)
docker compose down -v
```
