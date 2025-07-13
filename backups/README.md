# Backups Directory

This directory contains backups of the database and migration files.

## Contents

### Database Backups
- `pb_data_YYYYMMDD_HHMMSS/` - Timestamped database backups
  - Contains complete PocketBase database and storage files
  - Includes SQLite database files and uploaded assets

### Migration Backups
- `pb_migrations_backup/` - Archived migration files
  - Contains previous versions of migration scripts
  - Useful for rollback scenarios or reference

## Backup Strategy

Database backups are created manually before major changes:
- Before schema migrations
- Before production deployments
- Before major feature updates

## Restoration

To restore a database backup:

1. Stop PocketBase service
2. Backup current `pb_data` directory
3. Replace `pb_data` with backup directory
4. Restart PocketBase service

```bash
# Example restoration
pkill -f pocketbase
cp -r pb_data pb_data_current_backup
rm -rf pb_data
cp -r backups/pb_data_20250712_184936 pb_data
./pocketbase serve --http=0.0.0.0:8090
```

## Note

This directory is excluded from git via `.gitignore` to prevent committing sensitive data.