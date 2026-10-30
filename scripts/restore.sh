#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# StudyHub Production Database Restore Script
# Restores a compressed SQL dump to target PostgreSQL database
# Usage: ./restore.sh /path/to/studyhub_backup_YYYYMMDD_HHMMSS.sql.gz
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "❌ Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file '${BACKUP_FILE}' does not exist."
    exit 1
fi

POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-studyhub_db}"

echo "⚠️ WARNING: This will overwrite data in '${POSTGRES_DB}' on ${POSTGRES_HOST}:${POSTGRES_PORT}."
read -p "Proceed with database restore? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore aborted by user."
    exit 0
fi

echo "🔄 [$(date -Iseconds)] Restoring database from ${BACKUP_FILE}..."

export PGPASSWORD="${POSTGRES_PASSWORD:-postgrespassword}"

# Decompress and feed into psql
gunzip -c "${BACKUP_FILE}" | psql \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -v ON_ERROR_STOP=1

echo "✅ [$(date -Iseconds)] Database restoration complete!"
