#!/bin/sh

set -eu

BACKUP_FOLDER="/backups"
BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_FOLDER"

while true
do
  TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
  BACKUP_FILE="$BACKUP_FOLDER/ft_transcendence_$TIMESTAMP.archive.gz"

  if mongodump \
    --host mongodb \
    --port 27017 \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --db ft_transcendence \
    --archive="$BACKUP_FILE" \
    --gzip
  then
    chmod 644 "$BACKUP_FILE"
    echo "Automatic database backup created: $BACKUP_FILE"
    find "$BACKUP_FOLDER" \
      -type f \
      -name "ft_transcendence_*.archive.gz" \
      -mtime "+$BACKUP_RETENTION_DAYS" \
      -delete
  else
    rm -f "$BACKUP_FILE"
    echo "Automatic database backup failed" >&2
  fi

  sleep "$BACKUP_INTERVAL_SECONDS"
done