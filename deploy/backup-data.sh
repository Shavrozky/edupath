#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/edupath}"
BACKUP_DIR="${BACKUP_DIR:-/opt/edupath-backups}"
DATE="$(date +%F-%H%M%S)"

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/data-$DATE.tar.gz" -C "$APP_DIR/backend/app" data
find "$BACKUP_DIR" -type f -name "data-*.tar.gz" -mtime +30 -delete

echo "Backup created: $BACKUP_DIR/data-$DATE.tar.gz"
