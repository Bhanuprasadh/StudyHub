# ──────────────────────────────────────────────────────────────────────────────
# StudyHub Windows Database Backup Script (PowerShell)
# ──────────────────────────────────────────────────────────────────────────────
[CmdletBinding()]
param(
    [string]$BackupDir = ".\backups",
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432,
    [string]$PostgresUser = "postgres",
    [string]$PostgresDb = "studyhub_db",
    [int]$RetentionDays = 7
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "studyhub_backup_$Timestamp.sql"

Write-Host "📦 Creating PostgreSQL database dump for '$PostgresDb'..." -ForegroundColor Cyan

& pg_dump -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -F p --no-owner --no-acl -f $BackupFile

if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupFile)) {
    $FileSize = (Get-Item $BackupFile).Length / 1MB
    Write-Host "✅ Backup created successfully: $BackupFile ($([math]::Round($FileSize, 2)) MB)" -ForegroundColor Green

    # Cleanup old backups
    $LimitDate = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "studyhub_backup_*.sql" | Where-Object { $_.LastWriteTime -lt $LimitDate } | Remove-Item -Force
    Write-Host "✨ Retention cleanup complete." -ForegroundColor Green
} else {
    Write-Host "❌ Database dump failed with exit code $LASTEXITCODE." -ForegroundColor Red
}
