#!/bin/bash

# SoccerAI Database Backup Script

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/soccerai_backups"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "🚀 Starting database backup process..."

# Backup database
BACKUP_FILE="$BACKUP_DIR/soccerai_db_backup_$TIMESTAMP.sql"
log "📦 Creating database backup: $BACKUP_FILE"

if ! docker exec soccerai_postgres pg_dump -U soccerai_user soccerai > "$BACKUP_FILE"; then
    error "Database backup failed"
fi

# Compress backup
log "🗜️ Compressing backup..."
gzip "$BACKUP_FILE"

# Create metadata file
cat > "$BACKUP_DIR/soccerai_backup_metadata_$TIMESTAMP.txt" << EOF
SoccerAI Database Backup Metadata
=================================
Backup Date: $(date)
Timestamp: $TIMESTAMP
Database: soccerai
User: soccerai_user
Backup File: soccerai_db_backup_$TIMESTAMP.sql.gz

Database Statistics:
- Total tables: $(docker exec soccerai_postgres psql -U soccerai_user -d soccerai -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
- Users count: $(docker exec soccerai_postgres psql -U soccerai_user -d soccerai -t -c "SELECT count(*) FROM users;" | xargs)
- Matches count: $(docker exec soccerai_postgres psql -U soccerai_user -d soccerai -t -c "SELECT count(*) FROM matches;" | xargs)
- Predictions count: $(docker exec soccerai_postgres psql -U soccerai_user -d soccerai -t -c "SELECT count(*) FROM predictions;" | xargs)

Backup Size: $(du -h "$BACKUP_FILE.gz" | cut -f1)
EOF

# Upload to cloud storage (if configured)
if [ ! -z "$AWS_S3_BUCKET" ]; then
    log "☁️ Uploading backup to S3..."
    aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/soccerai-backups/"
    aws s3 cp "$BACKUP_DIR/soccerai_backup_metadata_$TIMESTAMP.txt" "s3://$AWS_S3_BUCKET/soccerai-backups/"
fi

# Clean up old backups
log "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "soccerai_db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "soccerai_backup_metadata_*.txt" -type f -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
log "🔍 Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE.gz"; then
    log "✅ Backup integrity verified"
else
    error "Backup integrity check failed"
fi

log "🎉 Database backup completed successfully!"
log "📁 Backup location: $BACKUP_FILE.gz"
log "📊 Metadata: $BACKUP_DIR/soccerai_backup_metadata_$TIMESTAMP.txt"