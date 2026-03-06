# Restore/Import Pentaract PostgreSQL database from backup
# Usage: .\scripts\restore.ps1 <backup_file>
# Example: .\scripts\restore.ps1 backups\pentaract_20250107_120000.sql

$ErrorActionPreference = "Stop"
$ContainerName = "pentaract_db"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
        }
    }
}

$DbUser = if ($env:DATABASE_USER) { $env:DATABASE_USER } else { "pentaract" }
$DbName = if ($env:DATABASE_NAME) { $env:DATABASE_NAME } else { "pentaract" }

if ($args.Count -eq 0) {
    Write-Host "Usage: .\scripts\restore.ps1 <backup_file>"
    Write-Host "Example: .\scripts\restore.ps1 backups\pentaract_20250107_120000.sql"
    exit 1
}

$BackupFile = $args[0]

if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile"
    exit 1
}

Write-Host "Restoring database '$DbName' from $BackupFile..."
Write-Host "WARNING: This will overwrite existing data. Press Ctrl+C to cancel, or wait 5 seconds..."
Start-Sleep -Seconds 5

Get-Content $BackupFile -Raw -Encoding UTF8 | docker exec -i $ContainerName psql -U $DbUser -d $DbName
Write-Host "Restore completed successfully."
