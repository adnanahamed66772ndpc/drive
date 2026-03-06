# Backup Pentaract PostgreSQL database
# Usage: .\scripts\backup.ps1 [output_file]
# If output_file is not given, creates backups\pentaract_YYYYMMDD_HHMMSS.sql

$ErrorActionPreference = "Stop"
$ContainerName = "pentaract_db"
$BackupsDir = "backups"

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

New-Item -ItemType Directory -Force -Path $BackupsDir | Out-Null

if ($args.Count -gt 0) {
    $OutputFile = $args[0]
} else {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $OutputFile = Join-Path $BackupsDir "pentaract_$Timestamp.sql"
}

Write-Host "Backing up database '$DbName' to $OutputFile..."
docker exec $ContainerName pg_dump -U $DbUser -F p $DbName | Out-File -FilePath $OutputFile -Encoding utf8NoBOM
Write-Host "Backup completed: $OutputFile"
