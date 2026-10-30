# 💾 StudyHub Database Backup, Recovery & Disaster Recovery

> **Disaster Recovery Strategy**: RPO <= 24 hours &nbsp;|&nbsp; **RTO <= 30 minutes**

---

## 1. Automated Backup Strategy

StudyHub includes automated backup automation scripts in `scripts/`:
- **Linux / Docker**: `scripts/backup.sh` (compressed `pg_dump` with automatic retention pruning)
- **Windows**: `scripts/backup.ps1` (PowerShell equivalent)

### Backup Format
- Standard PostgreSQL plain SQL wrapped in gzip (`.sql.gz` or `.sql`).
- Flag options: `--no-owner --no-acl` to allow portability across environments and database user roles.

---

## 2. Setting Up Automated Daily Backups (Cron)

On a Linux host or Docker server, install a cron entry to execute daily at 02:00 AM UTC:

```bash
# Open crontab editor
crontab -e

# Add automated daily backup entry (retains last 7 days)
0 2 * * * /bin/bash /opt/studyhub/scripts/backup.sh >> /var/log/studyhub_backup.log 2>&1
```

---

## 3. Database Restoration Procedure

### Linux / Container Restore:
```bash
# Execute restore script with target backup file
./scripts/restore.sh /backups/studyhub_backup_20261030_020000.sql.gz
```

### Windows Restore:
```powershell
.\scripts\restore.ps1 -BackupFile .\backups\studyhub_backup_20261030_020000.sql
```

---

## 4. Alembic Migration Rollback Procedure

In case of bad schema deployments, Alembic migrations support zero-data-loss rollback:

```bash
# Inspect current database revision
docker compose exec backend alembic current

# Downgrade by 1 revision
docker compose exec backend alembic downgrade -1

# Downgrade to base initial schema
docker compose exec backend alembic downgrade base
```
