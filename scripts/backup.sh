#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# StudyHub Production Database Backup Script
# Creates compressed, timestamped PostgreSQL dumps with automatic retention
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/studyhub_backup_${TIMESTAMP}.sql.gz"

POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-studyhub_db}"

mkdir -p "${BACKUP_DIR}"

echo "📦 [$(date -Iseconds)] Initiating PostgreSQL dump for database '${POSTGRES_DB}' on ${POSTGRES_HOST}:${POSTGRES_PORT}..."

# Execute dump and pipe through gzip
PGPASSWORD="${POSTGRES_PASSWORD:-postgrespassword}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -F p \
    --no-owner \
    --no-acl \
    | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "✅ [$(date -Iseconds)] Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE})"

# Prune backups older than RETENTION_DAYS
echo "🧹 Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "studyhub_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "✨ Retention policy cleanup complete."
