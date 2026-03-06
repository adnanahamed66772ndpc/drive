#!/usr/bin/env bash
#
# Restore/Import Pentaract PostgreSQL database from backup
# Usage: ./scripts/restore.sh <backup_file>
# Example: ./scripts/restore.sh backups/pentaract_20250107_120000.sql

set -e

CONTAINER_NAME="pentaract_db"

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

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file>"
  echo "Example: $0 backups/pentaract_20250107_120000.sql"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring database '$DB_NAME' from $BACKUP_FILE..."
echo "WARNING: This will overwrite existing data. Press Ctrl+C to cancel, or wait 5 seconds..."
sleep 5

docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
echo "Restore completed successfully."
