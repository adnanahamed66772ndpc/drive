#!/usr/bin/env bash
#
# Backup Pentaract PostgreSQL database
# Usage: ./scripts/backup.sh [output_file]
# If output_file is not given, creates backups/pentaract_YYYYMMDD_HHMMSS.sql

set -e

CONTAINER_NAME="pentaract_db"
BACKUPS_DIR="backups"

# Load .env if exists (from project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

DB_USER="${DATABASE_USER:-pentaract}"
DB_NAME="${DATABASE_NAME:-pentaract}"

mkdir -p "$BACKUPS_DIR"

if [ -n "$1" ]; then
  OUTPUT_FILE="$1"
else
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  OUTPUT_FILE="$BACKUPS_DIR/pentaract_${TIMESTAMP}.sql"
fi

echo "Backing up database '$DB_NAME' to $OUTPUT_FILE..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -F p "$DB_NAME" > "$OUTPUT_FILE"
echo "Backup completed: $OUTPUT_FILE"
