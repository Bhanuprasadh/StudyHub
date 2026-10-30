# ──────────────────────────────────────────────────────────────────────────────
# StudyHub Windows Database Restore Script (PowerShell)
# ──────────────────────────────────────────────────────────────────────────────
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 5432,
    [string]$PostgresUser = "postgres",
    [string]$PostgresDb = "studyhub_db"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Error: Backup file '$BackupFile' was not found." -ForegroundColor Red
    exit 1
}

$Confirmation = Read-Host "⚠️ This will overwrite '$PostgresDb' on '$PostgresHost'. Type 'YES' to proceed"
if ($Confirmation -ne "YES") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "🔄 Restoring database from $BackupFile..." -ForegroundColor Cyan

Get-Content $BackupFile | & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -v ON_ERROR_STOP=1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Database restoration failed with exit code $LASTEXITCODE." -ForegroundColor Red
}
