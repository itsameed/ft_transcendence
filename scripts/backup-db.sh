#!/bin/sh

set -eu

BACKUP_FOLDER="database-backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_FOLDER/ft_transcendence_$TIMESTAMP.archive.gz"

mkdir -p "$BACKUP_FOLDER"

if docker compose exec -T mongodb sh -c '
  mongodump \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --db ft_transcendence \
    --archive \
    --gzip
' > "$BACKUP_FILE"
then
  echo "Database backup created: $BACKUP_FILE"
else
  rm -f "$BACKUP_FILE"
  echo "Database backup failed" >&2
  exit 1
fi