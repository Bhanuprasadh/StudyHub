# ──────────────────────────────────────────────────────────────────────────────
# StudyHub Backend — Multi-stage Production Dockerfile
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build Dependencies ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Install system compilation dependencies for psycopg2 and cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into dedicated target directory
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Production Runtime ───────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Set environment variables for Python in container
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PATH="/install/bin:${PATH}"

WORKDIR /app

# Install runtime PostgreSQL client library and curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Create non-root user and group
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/false -m appuser

# Copy application source code and migrations
COPY . /app

# Ensure correct file permissions
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Health check verifies the live database connection and FastAPI routing
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run database migrations then start the production server
# --workers 4 provides parallelism for CPU-bound work (bcrypt, etc.)
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"]
