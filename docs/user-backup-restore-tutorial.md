# NotesFlow User Backup & Restore Tutorial

This comprehensive guide walks you through backing up and restoring user data in NotesFlow, including real-world scenarios and troubleshooting tips.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Creating Backups](#creating-backups)
4. [Exploring Backups](#exploring-backups)
5. [Restoring Data](#restoring-data)
6. [Real-World Scenarios](#real-world-scenarios)
7. [Automation](#automation)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)

## Overview

The NotesFlow backup system provides:
- **Complete user data export** - All notes, folders, time blocks, preferences, and collaborations
- **Email-based identification** - Works even after database migrations or reconstructions
- **Granular restore options** - Restore everything or just specific items
- **Conflict resolution** - Smart handling of existing data during restore
- **Data exploration** - Browse and search backup contents without restoring

## Prerequisites

Before using the backup/restore scripts:

1. **Ensure you have database access**:
   ```bash
   # Check database connection
   bun run db:studio
   ```

2. **Create the backups directory** (if not exists):
   ```bash
   mkdir -p backups
   ```

3. **Verify user email exists**:
   ```sql
   -- In database studio
   SELECT email, name FROM user WHERE email = 'your-email@example.com';
   ```

## Creating Backups

### Basic Backup

The simplest way to create a backup:

```bash
bun run backup:user --email user@example.com
```

This creates a file like: `backups/backup-user-at-example.com-2024-01-20T10-30-00-000Z.json`

### Backup Options

#### Compressed Backup (Recommended for Large Data)
```bash
bun run backup:user --email user@example.com --compress
```
- Creates a `.json.gz` file
- Typically 70-80% smaller than uncompressed
- Automatically handled by restore scripts

#### Custom Output Directory
```bash
bun run backup:user --email user@example.com --output /path/to/custom/directory
```

#### Incremental Backup (Only Changed Items)
```bash
# Backup items modified in last 7 days
bun run backup:user --email user@example.com --incremental --since "2024-01-13"

# Backup items modified since specific date/time
bun run backup:user --email user@example.com --incremental --since "2024-01-15T14:30:00Z"
```

#### Verbose Output (See Progress)
```bash
bun run backup:user --email user@example.com --verbose
```

Output example:
```
Starting backup for user: user@example.com
[Finding user] 1/1
Found user: John Doe (123e4567-e89b-12d3-a456-426614174000)
[Fetching notes] 0/0
[Fetching folders] 0/0
[Processing notes] 45/45 Project Documentation
[Processing folders] 12/12 Archive
[Creating backup file] 0/0

=== Backup Summary ===
User: John Doe (user@example.com)
Notes: 45 (2 deleted)
Folders: 12 (0 deleted)
Time Blocks: 23
Collaborations: 5
AI Usage Records: 156
Backup saved to: backups/backup-user-at-example.com-2024-01-20T10-30-00-000Z.json
```

### What Gets Backed Up?

- **User Profile**: Name, email, settings
- **Notes**: All notes including content, tags, folder location
- **Folders**: Complete folder hierarchy
- **Time Blocks**: Calendar events and tasks
- **Collaborations**: Shared note permissions
- **AI Usage**: Token usage history
- **Preferences**: Theme, editor settings, etc.
- **Subscription**: Plan details and limits

## Exploring Backups

Before restoring, you can explore backup contents:

### View Backup Overview
```bash
bun run backup:explore --file backups/backup-user-at-example.com-2024-01-20T10-30-00-000Z.json
```

Output:
```
Backup File: backups/backup-user-at-example.com-2024-01-20T10-30-00-000Z.json
Version: 2.0
Date: 2024-01-20T10:30:00Z
User: user@example.com

Contains:
- 45 notes
- 12 folders
- 23 time blocks
```

### Detailed Statistics
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
- Notes: 45 (2 deleted)
- Folders: 12 (0 deleted)
- Time Blocks: 23

Notes by Folder:
  /Work/Projects: 15 notes
  /Work/Meetings: 8 notes
  /Personal: 10 notes
  /Archive: 12 notes

Largest Notes:
  - Project Documentation (125 KB) in /Work/Projects
  - Q4 Planning Notes (98 KB) in /Work/Planning
  - Research Notes (87 KB) in /Work/Research
```

### List Specific Items

#### List All Notes
```bash
bun run backup:explore --file backup.json --list notes
```

Output:
```
=== Notes ===

[Note] Weekly Team Meeting Notes
  ID: 123e4567-e89b-12d3-a456-426614174001
  Path: /Work/Meetings
  Size: 4.5 KB
  Updated: 2024-01-19T15:30:00Z
  Tags: meeting, team, weekly

[Note] Project Alpha Documentation
  ID: 123e4567-e89b-12d3-a456-426614174002
  Path: /Work/Projects
  Size: 125 KB
  Updated: 2024-01-18T10:15:00Z
  DELETED: 2024-01-19T09:00:00Z
```

#### List All Folders
```bash
bun run backup:explore --file backup.json --list folders
```

#### List Everything (JSON Format)
```bash
bun run backup:explore --file backup.json --list all --json > backup-contents.json
```

### Search Backup Contents
```bash
# Search for notes/folders containing "project"
bun run backup:explore --file backup.json --search "project"

# Case-insensitive search
bun run backup:explore --file backup.json --search "MEETING"
```

Output:
```
=== Search Results for "project" ===
Found 8 matches

[Note] Project Alpha Documentation
  Path: /Work/Projects
  Matches in: title, content

[Note] Project Beta Planning
  Path: /Work/Projects
  Matches in: title

[Folder] Projects
  Path: /Work/Projects
  Matches in: name, path
```

### View Specific Item Details
```bash
# View note details
bun run backup:explore --file backup.json --detail "123e4567-e89b-12d3-a456-426614174001"
```

Output:
```
=== Note Details ===
Title: Weekly Team Meeting Notes
ID: 123e4567-e89b-12d3-a456-426614174001
Path: /Work/Meetings
Size: 4.5 KB
Created: 2024-01-10T09:00:00Z
Updated: 2024-01-19T15:30:00Z
Deleted: No
Tags: meeting, team, weekly
Pinned: No
Archived: No

Content Preview:
{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Team Meeting - January 19, 2024"}]},{"type":"paragraph","content":[{"type":"tex...
```

## Restoring Data

### Full Restore (All User Data)

**⚠️ Warning**: Full restore will overwrite ALL existing data for the user!

```bash
# Preview what will be restored (recommended first step)
bun run restore:user --email user@example.com --file backup.json --dry-run

# Perform full restore
bun run restore:user --email user@example.com --file backup.json
```

### Partial Restore Options

#### Restore a Single Note

By ID:
```bash
bun run restore:user --email user@example.com --file backup.json \
  --mode note --id "123e4567-e89b-12d3-a456-426614174001"
```

By Title:
```bash
bun run restore:user --email user@example.com --file backup.json \
  --mode note --name "Project Documentation"
```

#### Restore a Folder (Including All Contents)

```bash
# Restore folder and all its notes/subfolders
bun run restore:user --email user@example.com --file backup.json \
  --mode folder --name "Work Projects"

# Preview first
bun run restore:user --email user@example.com --file backup.json \
  --mode folder --name "Work Projects" --dry-run
```

#### Restore Recently Deleted Items

```bash
# Restore items deleted in last 24 hours
bun run restore:user --email user@example.com --file backup.json \
  --mode deleted --since "24h"

# Restore items deleted in last week
bun run restore:user --email user@example.com --file backup.json \
  --mode deleted --since "7d"

# Restore items deleted in last month
bun run restore:user --email user@example.com --file backup.json \
  --mode deleted --since "1m"
```

#### Pattern-Based Restore

```bash
# Restore all notes with "Meeting" in the title
bun run restore:user --email user@example.com --file backup.json \
  --mode pattern --pattern "Meeting.*" --type notes

# Restore all folders starting with "Project"
bun run restore:user --email user@example.com --file backup.json \
  --mode pattern --pattern "^Project" --type folders

# Restore all items (notes and folders) containing "2024"
bun run restore:user --email user@example.com --file backup.json \
  --mode pattern --pattern "2024"
```

#### Time-Based Restore

```bash
# Restore all items modified in the last 48 hours (based on backup date)
bun run restore:user --email user@example.com --file backup.json \
  --mode timeRange --since "48h"
```

### Handling Conflicts

When restoring items that already exist, you have several options:

#### Skip (Default)
```bash
bun run restore:user --email user@example.com --file backup.json \
  --mode note --name "Existing Note" --conflict skip
```
- Leaves existing item unchanged
- Skips the restore for that item

#### Rename
```bash
bun run restore:user --email user@example.com --file backup.json \
  --mode note --name "Existing Note" --conflict rename
```
- Creates: "Existing Note (Restored 1)"
- Keeps both versions

#### Replace
```bash
bun run restore:user --email user@example.com --file backup.json \
  --mode note --name "Existing Note" --conflict replace
```
- Deletes existing item
- Restores backed-up version

#### Keep Both
```bash
bun run restore:user --email user@example.com --file backup.json \
  --mode note --name "Existing Note" --conflict keepBoth
```
- Similar to rename but always creates a new copy

## Real-World Scenarios

### Scenario 1: Accidentally Deleted Important Note

```bash
# 1. First, find the note in your backup
bun run backup:explore --file backup.json --search "important project"

# 2. Get the note ID from the search results
# Let's say it's: 123e4567-e89b-12d3-a456-426614174001

# 3. Restore just that note
bun run restore:user --email user@example.com --file backup.json \
  --mode note --id "123e4567-e89b-12d3-a456-426614174001"
```

### Scenario 2: Recover Entire Deleted Folder

```bash
# 1. List folders to find the deleted one
bun run backup:explore --file backup.json --list folders

# 2. Restore the folder and all its contents
bun run restore:user --email user@example.com --file backup.json \
  --mode folder --name "Q4 Planning" --conflict rename
```

### Scenario 3: Restore Notes from Yesterday's Work

```bash
# 1. Create today's backup first (for safety)
bun run backup:user --email user@example.com --compress

# 2. Restore items modified yesterday
bun run restore:user --email user@example.com --file yesterday-backup.json \
  --mode timeRange --since "24h" --conflict rename
```

### Scenario 4: Migrate User to New Account

```bash
# 1. Backup from old account
bun run backup:user --email old@example.com --compress

# 2. Restore to new account
bun run restore:user --email new@example.com \
  --file backup-old-at-example.com-2024-01-20.json.gz
```

### Scenario 5: Restore After Accidental Bulk Delete

```bash
# 1. Check what was deleted
bun run backup:explore --file backup.json --stats

# 2. See deleted items
bun run backup:explore --file backup.json --list notes | grep DELETED

# 3. Restore all deleted items from the last week
bun run restore:user --email user@example.com --file backup.json \
  --mode deleted --since "7d"
```

## Automation

### Daily Automatic Backups (Cron)

Add to your crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/notesflow && bun run backup:user --email user@example.com --compress --output /backup/location

# Weekly full backup on Sunday at 3 AM
0 3 * * 0 cd /path/to/notesflow && bun run backup:user --email user@example.com --compress --output /backup/weekly

# Keep only last 7 daily backups
0 4 * * * find /backup/location -name "backup-*.json.gz" -mtime +7 -delete
```

### Backup All Users Script

Create `scripts/backup-all-users.sh`:

```bash
#!/bin/bash
# Backup all active users

BACKUP_DIR="backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Get all user emails from database
USERS=$(bunx drizzle-kit studio --port 3333 & sleep 5 && \
  curl -s http://localhost:3333/api/users | jq -r '.[].email' && \
  pkill -f "drizzle-kit studio")

for email in $USERS; do
  echo "Backing up: $email"
  bun run backup:user --email "$email" --compress --output "$BACKUP_DIR"
done

echo "All backups completed in: $BACKUP_DIR"
```

### Pre-deployment Backup

Add to your deployment script:

```bash
#!/bin/bash
# Pre-deployment backup

echo "Creating pre-deployment backup..."
USERS=("user1@example.com" "user2@example.com" "user3@example.com")

for user in "${USERS[@]}"; do
  bun run backup:user --email "$user" --compress --output "backups/pre-deploy-$(date +%Y%m%d)"
done

# Continue with deployment...
```

## Troubleshooting

### Common Issues and Solutions

#### "User not found"
```bash
# Verify the email exists
bun run db:studio
# Check the user table for the exact email
```

#### "Backup file not found"
```bash
# Check file path and permissions
ls -la backups/
# If compressed, ensure .gz extension is included
```

#### "Failed to parse backup file"
```bash
# Check if file is compressed
file backup.json.gz
# If compressed but missing .gz extension, rename it
mv backup.json backup.json.gz
```

#### Large Backup Files
```bash
# Use compression
bun run backup:user --email user@example.com --compress

# Use incremental backups
bun run backup:user --email user@example.com --incremental --since "2024-01-15"
```

#### Restore Conflicts
```bash
# Always dry-run first
bun run restore:user --email user@example.com --file backup.json --dry-run

# Check specific conflicts
bun run backup:explore --file backup.json --list notes | grep "Note Title"
```

### Performance Tips

1. **For Large Databases**:
   ```bash
   # Use compression
   --compress
   
   # Backup in chunks using incremental
   --incremental --since "date"
   ```

2. **For Faster Restores**:
   ```bash
   # Restore specific items instead of full restore
   --mode note --id "specific-id"
   ```

3. **For Automation**:
   ```bash
   # Use JSON output for parsing
   --json > output.json
   ```

## Advanced Usage

### Backup Comparison

Find differences between two backups:

```bash
# Export both backups to JSON
bun run backup:explore --file backup1.json --list all --json > backup1-contents.json
bun run backup:explore --file backup2.json --list all --json > backup2-contents.json

# Compare using jq or diff
diff backup1-contents.json backup2-contents.json
```

### Selective Data Export

Export only specific data types:

```bash
# Export only notes as JSON
bun run backup:explore --file backup.json --list notes --json | \
  jq '.[] | select(.type == "note")' > notes-only.json
```

### Backup Verification

Verify backup integrity:

```bash
# Check backup file
bun run backup:explore --file backup.json --stats > /dev/null && \
  echo "Backup is valid" || echo "Backup is corrupted"
```

### Cross-User Restore

Restore one user's note to another user (admin only):

```bash
# 1. Backup source user
bun run backup:user --email source@example.com

# 2. Restore specific note to target user
bun run restore:user --email target@example.com \
  --file backup-source-at-example.com.json \
  --mode note --id "note-id-here"
```

## Best Practices

1. **Regular Backups**
   - Daily automated backups
   - Weekly full backups
   - Before major changes

2. **Backup Retention**
   - Keep daily backups for 7 days
   - Keep weekly backups for 4 weeks
   - Keep monthly backups for 1 year

3. **Testing**
   - Regularly test restore process
   - Verify backup integrity
   - Document restore procedures

4. **Security**
   - Encrypt sensitive backups
   - Store in secure locations
   - Limit access to backup files
   - Follow GDPR/privacy laws

5. **Documentation**
   - Log all restore operations
   - Document custom scripts
   - Keep restore procedures updated

## Quick Reference

### Backup Commands
```bash
# Basic backup
bun run backup:user --email user@example.com

# Compressed backup
bun run backup:user --email user@example.com --compress

# Incremental backup
bun run backup:user --email user@example.com --incremental --since "2024-01-15"

# Custom location
bun run backup:user --email user@example.com --output /custom/path
```

### Explore Commands
```bash
# View stats
bun run backup:explore --file backup.json --stats

# List items
bun run backup:explore --file backup.json --list notes
bun run backup:explore --file backup.json --list folders
bun run backup:explore --file backup.json --list all

# Search
bun run backup:explore --file backup.json --search "pattern"

# View details
bun run backup:explore --file backup.json --detail "item-id"
```

### Restore Commands
```bash
# Full restore
bun run restore:user --email user@example.com --file backup.json

# Single note
bun run restore:user --email user@example.com --file backup.json --mode note --id "id"

# Folder with contents
bun run restore:user --email user@example.com --file backup.json --mode folder --name "name"

# Deleted items
bun run restore:user --email user@example.com --file backup.json --mode deleted --since "24h"

# Pattern matching
bun run restore:user --email user@example.com --file backup.json --mode pattern --pattern "regex"

# Dry run
bun run restore:user --email user@example.com --file backup.json --dry-run

# Conflict resolution
bun run restore:user --email user@example.com --file backup.json --conflict rename
```

Remember: Always test with `--dry-run` first before performing actual restores!