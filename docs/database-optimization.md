# Database Optimization Guide

## Current Optimizations

### 1. Query Timeouts (Implemented)
- Global timeout of 5 seconds configured in connection pool
- Per-query timeouts using `withTimeout()` wrapper
- Timeout categories:
  - SHORT: 2 seconds (simple queries)
  - DEFAULT: 5 seconds (most queries)
  - LONG: 10 seconds (complex queries)
  - REPORT: 30 seconds (reporting queries)

### 2. Existing Indexes
The database schema includes comprehensive indexes for optimal query performance:

#### Notes Table
- `notes_user_id_idx` - Fast user note lookups
- `notes_folder_id_idx` - Folder-based queries
- `notes_user_id_folder_id_idx` - Composite for user+folder queries
- `notes_updated_at_idx` - Recent notes sorting
- `notes_last_accessed_at_idx` - Access tracking
- `notes_is_pinned_idx`, `notes_is_archived_idx`, `notes_is_trashed_idx` - Status filters
- `notes_deleted_at_idx` - Soft delete queries
- `notes_content_gin_idx` - Full-text search on JSONB content

#### Time Blocks Table
- `time_blocks_user_id_idx` - User calendar queries
- `time_blocks_note_id_idx` - Note-linked blocks
- `time_blocks_start_time_idx`, `time_blocks_end_time_idx` - Time range queries
- `time_blocks_user_id_time_range_idx` - Composite for efficient calendar views
- `time_blocks_recurrence_id_idx` - Recurring event queries

#### Collaborators Table
- `collaborators_note_id_idx` - Note collaboration lookups
- `collaborators_user_id_idx` - User's shared notes
- `collaborators_accepted_at_idx` - Pending invitations

#### Folders Table
- `folders_user_id_idx` - User folder queries
- `folders_parent_id_idx` - Folder hierarchy
- `folders_path_idx` - Path-based lookups
- `folders_user_id_parent_id_idx` - Composite for folder tree queries

### 3. Connection Pooling
- Max 10 connections
- Idle timeout: 20 seconds
- Connection timeout: 10 seconds
- Max lifetime: 30 minutes
- Prepared statements enabled for performance

## Query Optimization Best Practices

### 1. Use Query Timeouts
```typescript
import { withTimeout, QUERY_TIMEOUTS } from '@/lib/db/query-timeout';

// Simple query
const user = await withTimeout(
  db.select().from(users).where(eq(users.id, userId)),
  QUERY_TIMEOUTS.SHORT
);

// Complex query with joins
const notesWithFolders = await withTimeout(
  db.select()
    .from(notes)
    .leftJoin(folders, eq(notes.folderId, folders.id))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(50),
  QUERY_TIMEOUTS.DEFAULT
);
```

### 2. Batch Operations
```typescript
// Bad: N+1 queries
for (const noteId of noteIds) {
  await db.update(notes).set({ status: 'archived' }).where(eq(notes.id, noteId));
}

// Good: Single query
await db.update(notes)
  .set({ status: 'archived' })
  .where(inArray(notes.id, noteIds));
```

### 3. Limit Result Sets
```typescript
// Always use LIMIT for list queries
const recentNotes = await db.select()
  .from(notes)
  .where(eq(notes.userId, userId))
  .orderBy(desc(notes.updatedAt))
  .limit(20); // Prevent unbounded queries
```

### 4. Select Only Needed Columns
```typescript
// Bad: Selecting all columns including large content
const notes = await db.select().from(notes);

// Good: Select only required fields
const noteSummaries = await db.select({
  id: notes.id,
  title: notes.title,
  updatedAt: notes.updatedAt,
}).from(notes);
```

### 5. Use Composite Indexes
```typescript
// This query uses the composite index notes_user_id_folder_id_idx
const folderNotes = await db.select()
  .from(notes)
  .where(and(
    eq(notes.userId, userId),
    eq(notes.folderId, folderId),
    isNull(notes.deletedAt)
  ));
```

### 6. Optimize JOIN Queries
```typescript
// Use EXISTS for checking relationships instead of JOIN when not needing data
const hasCollaborators = await db.select({
  exists: sql`EXISTS (
    SELECT 1 FROM ${collaborators} 
    WHERE ${collaborators.noteId} = ${notes.id}
  )`
}).from(notes).where(eq(notes.id, noteId));
```

### 7. Transaction Best Practices
```typescript
import { transactionWithTimeout } from '@/lib/db/query-timeout';

// Use transactions for related operations
await transactionWithTimeout(async (tx) => {
  const [note] = await tx.insert(notes).values(noteData).returning();
  await tx.insert(collaborators).values({
    noteId: note.id,
    userId: collaboratorId,
    permissionLevel: 'view'
  });
}, QUERY_TIMEOUTS.DEFAULT);
```

## Monitoring Queries

### 1. Slow Query Detection
```typescript
// Wrap queries to log slow operations
async function monitoredQuery<T>(
  query: Promise<T>,
  queryName: string,
  threshold = 1000
): Promise<T> {
  const start = Date.now();
  try {
    const result = await query;
    const duration = Date.now() - start;
    if (duration > threshold) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query failed: ${queryName} after ${duration}ms`, error);
    throw error;
  }
}
```

### 2. Database Health Check
The existing health check in `/lib/db/index.ts` provides basic connectivity testing:
```typescript
export async function checkDatabaseConnection() {
  try {
    await queryClient`SELECT 1`;
    return { connected: true };
  } catch (error) {
    return { connected: false, error };
  }
}
```

## Performance Optimization Checklist

- [ ] All queries use appropriate timeouts
- [ ] Large result sets are paginated
- [ ] Composite indexes exist for multi-column WHERE clauses
- [ ] JOINs are used only when necessary
- [ ] Batch operations replace loops where possible
- [ ] Only required columns are selected
- [ ] Transactions group related operations
- [ ] Connection pool is properly configured
- [ ] Monitoring is in place for slow queries

## Future Optimizations

1. **Query Result Caching**
   - Implement Redis for frequently accessed data
   - Cache user preferences, folder structures

2. **Read Replicas**
   - Distribute read load across replicas
   - Route analytical queries to replicas

3. **Partitioning**
   - Partition time_blocks table by date range
   - Archive old notes to separate tables

4. **Materialized Views**
   - Pre-compute folder hierarchies
   - Cache note statistics per user