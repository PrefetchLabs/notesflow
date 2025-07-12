# Backup and Restore Guide

NotesFlow provides comprehensive backup and restore functionality for user data, supporting both full and partial restores.

## Features

- **Email-based backup**: Use email as the unique identifier (survives database reconstructions)
- **Comprehensive data coverage**: Notes, folders, time blocks, collaborations, preferences, and more
- **Partial restore support**: Restore specific items like accidentally deleted notes or folders
- **Conflict resolution**: Multiple strategies for handling existing data
- **Compressed backups**: Optional gzip compression
- **Backup exploration**: Browse and search backup contents

## Backup Commands

### Full Backup
```bash
# Basic backup
bun run backup:user --email user@example.com

# Save to specific directory
bun run backup:user --email user@example.com --output /path/to/backups

# Compressed backup
bun run backup:user --email user@example.com --compress

# Incremental backup (only changed items)
bun run backup:user --email user@example.com --incremental --since "2024-01-15"

# Verbose output
bun run backup:user --email user@example.com --verbose
```

### Backup File Format
Backups are saved as JSON files with the naming pattern:
```
backup-{email}-{timestamp}.json
backup-user-at-example.com-2024-01-20T10-30-00-000Z.json
```

## Restore Commands

### Full Restore
```bash
# Restore all data for a user
bun run restore:user --email user@example.com --file backup.json

# Dry run (preview what would be restored)
bun run restore:user --email user@example.com --file backup.json --dry-run
```

### Partial Restore

#### Restore a Single Note
```bash
# By ID
bun run restore:user --email user@example.com --file backup.json --mode note --id "note-123"

# By title
bun run restore:user --email user@example.com --file backup.json --mode note --name "Meeting Notes"
```

#### Restore a Folder (with contents)
```bash
# By ID
bun run restore:user --email user@example.com --file backup.json --mode folder --id "folder-456"

# By name
bun run restore:user --email user@example.com --file backup.json --mode folder --name "Project A"
```

#### Restore Recently Deleted Items
```bash
# Items deleted in last 24 hours
bun run restore:user --email user@example.com --file backup.json --mode deleted --since "24h"

# Items deleted in last 7 days
bun run restore:user --email user@example.com --file backup.json --mode deleted --since "7d"
```

#### Pattern-Based Restore
```bash
# All notes matching pattern
bun run restore:user --email user@example.com --file backup.json --mode pattern --pattern "Meeting.*"

# Only folders matching pattern
bun run restore:user --email user@example.com --file backup.json --mode pattern --type folders --pattern "Project.*"
```

#### Time Range Restore
```bash
# All items modified in last 48 hours
bun run restore:user --email user@example.com --file backup.json --mode timeRange --since "48h"
```

### Conflict Resolution

When restoring items that already exist, use the `--conflict` option:

```bash
# Skip existing items (default)
--conflict skip

# Rename incoming items
--conflict rename  # Creates "Note Title (Restored 1)"

# Replace existing items
--conflict replace

# Keep both versions
--conflict keepBoth
```

Example:
```bash
bun run restore:user --email user@example.com --file backup.json --mode note --name "Important Note" --conflict rename
```

## Explore Backups

### View Backup Statistics
```bash
bun run backup:explore --file backup.json --stats
```

Output:
```
=== Backup Statistics ===
Version: 2.0
Backup Date: 2024-01-20T10:30:00Z
User: user@example.com
Total Size: 2.5 MB

Content Summary:
- Notes: 150 (5 deleted)
- Folders: 25 (2 deleted)
- Time Blocks: 45

Notes by Folder:
  /Work/Projects: 45 notes
  /Personal: 30 notes
  /Archive: 25 notes

Largest Notes:
  - Project Documentation (125 KB) in /Work/Projects
  - Meeting Notes 2024 (98 KB) in /Work/Meetings
```

### List Items
```bash
# List all notes
bun run backup:explore --file backup.json --list notes

# List all folders
bun run backup:explore --file backup.json --list folders

# List everything
bun run backup:explore --file backup.json --list all

# Output as JSON
bun run backup:explore --file backup.json --list notes --json
```

### Search Backup
```bash
# Search for items
bun run backup:explore --file backup.json --search "project"

# Search with JSON output
bun run backup:explore --file backup.json --search "meeting" --json
```

### View Item Details
```bash
# View specific item by ID
bun run backup:explore --file backup.json --detail "note-123"
```

## Best Practices

### Regular Backups
Set up a cron job for automatic backups:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/notesflow && bun run backup:user --email user@example.com --compress
```

### Backup Retention
Example retention script:
```bash
# Keep daily backups for 7 days, weekly for 4 weeks, monthly for 1 year
find backups/ -name "backup-*.json.gz" -mtime +7 -delete
```

### Before Major Changes
Always create a backup before:
- Upgrading the application
- Database migrations
- Bulk operations
- Sharing access with others

### Testing Restores
Periodically test your restore process:
```bash
# Test restore to a different email
bun run restore:user --email test@example.com --file backup.json --dry-run
```

## Troubleshooting

### Common Issues

1. **"User not found"**
   - Ensure the email exists in the database
   - Check for typos in the email address

2. **"Backup file not found"**
   - Verify the file path is correct
   - Check file permissions

3. **Conflicts during restore**
   - Use `--dry-run` to preview conflicts
   - Choose appropriate conflict resolution strategy
   - Consider using pattern-based restore for specific items

4. **Large backup files**
   - Use `--compress` option
   - Consider incremental backups
   - Archive old backups to cold storage

### Performance Tips

- For large databases, use incremental backups
- Compress backups to save storage space
- Run backups during off-peak hours
- Use specific restore modes instead of full restore when possible

## Security Considerations

1. **Encrypt sensitive backups**
   ```bash
   # Encrypt backup
   openssl enc -aes-256-cbc -in backup.json -out backup.json.enc
   
   # Decrypt backup
   openssl dec -aes-256-cbc -in backup.json.enc -out backup.json
   ```

2. **Secure storage**
   - Store backups in secure locations
   - Limit access to backup files
   - Consider cloud storage with encryption

3. **Data privacy**
   - Be aware backups contain all user data
   - Follow data retention policies
   - Provide users with their backups on request (GDPR compliance)

## API Integration

The backup system can be integrated into your application:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Create backup
async function createUserBackup(email: string) {
  const { stdout, stderr } = await execAsync(
    `bun run backup:user --email ${email} --compress`
  );
  return stdout;
}

// Restore specific note
async function restoreNote(email: string, backupFile: string, noteId: string) {
  const { stdout, stderr } = await execAsync(
    `bun run restore:user --email ${email} --file ${backupFile} --mode note --id ${noteId}`
  );
  return stdout;
}
```