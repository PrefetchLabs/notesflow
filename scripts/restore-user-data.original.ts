#!/usr/bin/env bun
import { db } from '@/lib/db';
import { 
  user, 
  notes, 
  folders, 
  timeBlocks, 
  collaborators, 
  aiUsage, 
  subscriptions,
  userPreferences 
} from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import { gunzipSync } from 'zlib';
import { 
  BackupFile, 
  RestoreOptions, 
  RestoreResult,
  ConflictItem,
  validateBackupFile,
  filterItemsForRestore,
  generateUniqueName,
  createProgressReporter,
  generateContentHash
} from '@/lib/backup/utils';

// Parse command line arguments
const args = process.argv.slice(2);
const emailIndex = args.indexOf('--email');
const fileIndex = args.indexOf('--file');
const modeIndex = args.indexOf('--mode');
const idIndex = args.indexOf('--id');
const nameIndex = args.indexOf('--name');
const patternIndex = args.indexOf('--pattern');
const sinceIndex = args.indexOf('--since');
const typeIndex = args.indexOf('--type');
const dryRunIndex = args.indexOf('--dry-run');
const conflictIndex = args.indexOf('--conflict');
const verboseIndex = args.indexOf('--verbose');

if (emailIndex === -1 || fileIndex === -1 || emailIndex === args.length - 1 || fileIndex === args.length - 1) {
  console.error('Usage: bun run scripts/restore-user-data.ts --email <email> --file <backup-file> [options]');
  console.error('\nOptions:');
  console.error('  --mode <full|note|folder|deleted|pattern|timeRange>  Restore mode (default: full)');
  console.error('  --id <item-id>                                       Item ID for single item restore');
  console.error('  --name <item-name>                                   Item name for single item restore');
  console.error('  --pattern <pattern>                                  Pattern for pattern-based restore');
  console.error('  --since <duration>                                   Time duration (e.g., "24h", "7d")');
  console.error('  --type <notes|folders|timeBlocks>                   Item type for filtering');
  console.error('  --conflict <skip|rename|replace|keepBoth>           Conflict resolution (default: skip)');
  console.error('  --dry-run                                           Preview what would be restored');
  console.error('  --verbose                                           Show detailed progress');
  process.exit(1);
}

const userEmail = args[emailIndex + 1];
const backupFile = args[fileIndex + 1];
const mode = modeIndex !== -1 && modeIndex < args.length - 1 ? args[modeIndex + 1] : 'full';
const itemId = idIndex !== -1 && idIndex < args.length - 1 ? args[idIndex + 1] : undefined;
const itemName = nameIndex !== -1 && nameIndex < args.length - 1 ? args[nameIndex + 1] : undefined;
const pattern = patternIndex !== -1 && patternIndex < args.length - 1 ? args[patternIndex + 1] : undefined;
const since = sinceIndex !== -1 && sinceIndex < args.length - 1 ? args[sinceIndex + 1] : undefined;
const type = typeIndex !== -1 && typeIndex < args.length - 1 ? args[typeIndex + 1] : undefined;
const conflictResolution = conflictIndex !== -1 && conflictIndex < args.length - 1 ? args[conflictIndex + 1] : 'skip';
const dryRun = dryRunIndex !== -1;
const verbose = verboseIndex !== -1;

// Create restore options
const restoreOptions: RestoreOptions = {
  mode: mode as any,
  itemId,
  itemName,
  pattern,
  since,
  type: type as any,
  dryRun,
  conflictResolution: conflictResolution as any,
  restoreDeleted: mode === 'deleted',
  preserveTimestamps: true
};

// Create progress reporter
const progress = createProgressReporter(verbose ? (p) => {
  console.log(`[${p.phase}] ${p.current}/${p.total} ${p.item || ''}`);
} : undefined);

async function restoreUserData() {
  const result: RestoreResult = {
    success: false,
    restored: { notes: 0, folders: 0, timeBlocks: 0 },
    skipped: { notes: 0, folders: 0, timeBlocks: 0 },
    errors: [],
    conflicts: [],
    idMappings: {}
  };

  try {
    // Check if backup file exists
    if (!existsSync(backupFile)) {
      console.error(`Backup file not found: ${backupFile}`);
      process.exit(1);
    }

    // Read and parse backup file
    progress.setPhase('Reading backup file');
    let backupContent: string;
    
    if (backupFile.endsWith('.gz')) {
      const compressed = readFileSync(backupFile);
      backupContent = gunzipSync(compressed).toString();
    } else {
      backupContent = readFileSync(backupFile, 'utf-8');
    }
    
    const backup: BackupFile = validateBackupFile(JSON.parse(backupContent));
    
    console.log(`\nBackup Information:`);
    console.log(`- Version: ${backup.version}`);
    console.log(`- Date: ${backup.backupDate}`);
    console.log(`- Original User: ${backup.userEmail}`);
    console.log(`- Total Items: ${backup.metadata.totalNotes} notes, ${backup.metadata.totalFolders} folders`);
    console.log(`- Deleted Items: ${backup.metadata.deletedItems.notes} notes, ${backup.metadata.deletedItems.folders} folders\n`);

    // Find target user
    progress.setPhase('Finding target user');
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, userEmail));
      
    if (!targetUser) {
      console.error(`Target user not found: ${userEmail}`);
      process.exit(1);
    }
    
    console.log(`Target user: ${targetUser.name || 'Unknown'} (${targetUser.id})`);
    
    // Filter items based on restore options
    progress.setPhase('Filtering items');
    const { notes: notesToRestore, folders: foldersToRestore } = filterItemsForRestore(backup, restoreOptions);
    
    console.log(`\nItems to restore:`);
    console.log(`- Notes: ${notesToRestore.length}`);
    console.log(`- Folders: ${foldersToRestore.length}`);
    
    if (dryRun) {
      console.log('\n=== DRY RUN MODE - No changes will be made ===\n');
      
      if (notesToRestore.length > 0) {
        console.log('Notes that would be restored:');
        notesToRestore.forEach(note => {
          console.log(`  - ${note.title} (${note.metadata?.originalPath || '/'})`);
        });
      }
      
      if (foldersToRestore.length > 0) {
        console.log('\nFolders that would be restored:');
        foldersToRestore.forEach(folder => {
          console.log(`  - ${folder.path}`);
        });
      }
      
      process.exit(0);
    }
    
    // Start transaction for atomic restore
    await db.transaction(async (tx) => {
      // Restore folders first (to maintain hierarchy)
      if (foldersToRestore.length > 0) {
        progress.setPhase('Restoring folders');
        progress.setTotal(foldersToRestore.length);
        
        // Get existing folders for conflict detection
        const existingFolders = await tx
          .select()
          .from(folders)
          .where(eq(folders.userId, targetUser.id));
          
        const existingFolderNames = existingFolders.map(f => f.name);
        
        // Sort folders by hierarchy (parents first)
        const sortedFolders = [...foldersToRestore].sort((a, b) => {
          const aDepth = a.path.split('/').length;
          const bDepth = b.path.split('/').length;
          return aDepth - bDepth;
        });
        
        for (const folder of sortedFolders) {
          progress.increment(folder.name);
          
          // Check for conflicts
          const existingFolder = existingFolders.find(f => f.name === folder.name && f.parentId === folder.parentId);
          
          if (existingFolder) {
            switch (restoreOptions.conflictResolution) {
              case 'skip':
                result.skipped.folders++;
                continue;
              case 'rename':
                folder.name = generateUniqueName(folder.name, existingFolderNames);
                break;
              case 'replace':
                await tx.delete(folders).where(eq(folders.id, existingFolder.id));
                break;
              case 'keepBoth':
                folder.name = generateUniqueName(folder.name, existingFolderNames);
                break;
            }
          }
          
          // Map old ID to new ID
          const oldId = folder.id;
          const newId = crypto.randomUUID();
          result.idMappings[oldId] = newId;
          
          // Update parent ID if needed
          if (folder.parentId && result.idMappings[folder.parentId]) {
            folder.parentId = result.idMappings[folder.parentId];
          }
          
          // Insert folder
          await tx.insert(folders).values({
            ...folder,
            id: newId,
            userId: targetUser.id,
            createdAt: restoreOptions.preserveTimestamps ? folder.createdAt : new Date(),
            updatedAt: new Date()
          });
          
          result.restored.folders++;
          existingFolderNames.push(folder.name);
        }
      }
      
      // Restore notes
      if (notesToRestore.length > 0) {
        progress.setPhase('Restoring notes');
        progress.setTotal(notesToRestore.length);
        
        // Get existing notes for conflict detection
        const existingNotes = await tx
          .select()
          .from(notes)
          .where(eq(notes.userId, targetUser.id));
          
        const existingNoteTitles = existingNotes.map(n => n.title);
        
        for (const note of notesToRestore) {
          progress.increment(note.title);
          
          // Check for conflicts
          const contentHash = generateContentHash(note.content);
          const existingNote = existingNotes.find(n => 
            n.title === note.title || generateContentHash(n.content) === contentHash
          );
          
          if (existingNote) {
            result.conflicts.push({
              type: 'note',
              existing: existingNote,
              incoming: note,
              resolution: restoreOptions.conflictResolution
            });
            
            switch (restoreOptions.conflictResolution) {
              case 'skip':
                result.skipped.notes++;
                continue;
              case 'rename':
                note.title = generateUniqueName(note.title, existingNoteTitles);
                break;
              case 'replace':
                await tx.delete(notes).where(eq(notes.id, existingNote.id));
                break;
              case 'keepBoth':
                note.title = generateUniqueName(note.title, existingNoteTitles);
                break;
            }
          }
          
          // Map folder ID if needed
          if (note.folderId && result.idMappings[note.folderId]) {
            note.folderId = result.idMappings[note.folderId];
          }
          
          // Generate new ID
          const newNoteId = crypto.randomUUID();
          result.idMappings[note.id] = newNoteId;
          
          // Insert note
          await tx.insert(notes).values({
            ...note,
            id: newNoteId,
            userId: targetUser.id,
            lastEditedBy: targetUser.id,
            createdAt: restoreOptions.preserveTimestamps ? note.createdAt : new Date(),
            updatedAt: new Date(),
            deletedAt: restoreOptions.restoreDeleted ? null : note.deletedAt,
            metadata: undefined // Don't store backup metadata in the note
          });
          
          result.restored.notes++;
          existingNoteTitles.push(note.title);
        }
      }
      
      // Restore time blocks if in full mode
      if (restoreOptions.mode === 'full' && backup.data.timeBlocks.length > 0) {
        progress.setPhase('Restoring time blocks');
        progress.setTotal(backup.data.timeBlocks.length);
        
        for (const block of backup.data.timeBlocks) {
          progress.increment(block.title);
          
          // Map note ID if needed
          if (block.noteId && result.idMappings[block.noteId]) {
            block.noteId = result.idMappings[block.noteId];
          }
          
          // Insert time block with new ID
          await tx.insert(timeBlocks).values({
            ...block,
            id: crypto.randomUUID(),
            userId: targetUser.id,
            createdAt: restoreOptions.preserveTimestamps ? block.createdAt : new Date(),
            updatedAt: new Date()
          });
          
          result.restored.timeBlocks++;
        }
      }
    });
    
    result.success = true;
    
    // Print summary
    console.log('\n=== Restore Summary ===');
    console.log(`Mode: ${restoreOptions.mode}`);
    console.log(`\nRestored:`);
    console.log(`- Notes: ${result.restored.notes}`);
    console.log(`- Folders: ${result.restored.folders}`);
    console.log(`- Time Blocks: ${result.restored.timeBlocks}`);
    
    if (result.skipped.notes > 0 || result.skipped.folders > 0) {
      console.log(`\nSkipped (conflicts):`);
      console.log(`- Notes: ${result.skipped.notes}`);
      console.log(`- Folders: ${result.skipped.folders}`);
    }
    
    if (result.conflicts.length > 0) {
      console.log(`\nConflicts resolved with strategy: ${restoreOptions.conflictResolution}`);
      result.conflicts.forEach(conflict => {
        console.log(`  - ${conflict.type}: "${conflict.existing.title || conflict.existing.name}"`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log(`\nErrors:`);
      result.errors.forEach(error => console.error(`  - ${error}`));
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Restore failed:', error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run restore
restoreUserData();