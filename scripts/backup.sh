#!/bin/bash
# GTA CRM Manual Backup Script
# Usage: ./scripts/backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

echo "Starting GTA CRM backup..."

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable not set"
  echo "Usage: DATABASE_URL='postgresql://...' ./scripts/backup.sh"
  exit 1
fi

pg_dump "$DATABASE_URL" > "$BACKUP_DIR/gta_crm_backup_$TIMESTAMP.sql"

echo "Backup saved: $BACKUP_DIR/gta_crm_backup_$TIMESTAMP.sql"
echo "Size: $(du -h "$BACKUP_DIR/gta_crm_backup_$TIMESTAMP.sql" | cut -f1)"
echo "Done!"
