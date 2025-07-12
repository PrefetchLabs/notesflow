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
import { eq, and, or, isNotNull, inArray } from 'drizzle-orm';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';
import { 
  BackupFile, 
  BackupNote, 
  BackupFolder, 
  BACKUP_VERSION,
  buildFolderPath,
  createProgressReporter 
} from '@/lib/backup/utils';

// Parse command line arguments
const args = process.argv.slice(2);
const emailIndex = args.indexOf('--email');
const outputIndex = args.indexOf('--output');
const incrementalIndex = args.indexOf('--incremental');
const sinceIndex = args.indexOf('--since');
const compressIndex = args.indexOf('--compress');
const verboseIndex = args.indexOf('--verbose');

if (emailIndex === -1 || emailIndex === args.length - 1) {
  console.error('Usage: bun run scripts/backup-user-data.ts --email <email> [--output <dir>] [--incremental] [--since <date>] [--compress] [--verbose]');
  process.exit(1);
}

const userEmail = args[emailIndex + 1];
const outputDir = outputIndex !== -1 && outputIndex < args.length - 1 ? args[outputIndex + 1] : 'backups';
const isIncremental = incrementalIndex !== -1;
const since = sinceIndex !== -1 && sinceIndex < args.length - 1 ? new Date(args[sinceIndex + 1]) : null;
const shouldCompress = compressIndex !== -1;
const verbose = verboseIndex !== -1;

// Create progress reporter
const progress = createProgressReporter(verbose ? (p) => {
  console.log(`[${p.phase}] ${p.current}/${p.total} ${p.item || ''}`);
} : undefined);

async function backupUserData() {
  try {
    console.log(`Starting backup for user: ${userEmail}`);
    progress.setPhase('Finding user');
    
    // Find user by email
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, userEmail));
      
    if (!targetUser) {
      console.error(`User not found: ${userEmail}`);
      process.exit(1);
    }
    
    console.log(`Found user: ${targetUser.name || 'Unknown'} (${targetUser.id})`);
    
    // Fetch all user data
    progress.setPhase('Fetching notes');
    let userNotes = await db
      .select()
      .from(notes)
      .where(
        isIncremental && since
          ? and(eq(notes.userId, targetUser.id), or(isNotNull(notes.updatedAt)))
          : eq(notes.userId, targetUser.id)
      );
      
    if (isIncremental && since) {
      userNotes = userNotes.filter(n => new Date(n.updatedAt) >= since);
    }
    
    progress.setPhase('Fetching folders');
    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, targetUser.id));
      
    progress.setPhase('Fetching time blocks');
    const userTimeBlocks = await db
      .select()
      .from(timeBlocks)
      .where(eq(timeBlocks.userId, targetUser.id));
      
    progress.setPhase('Fetching collaborations');
    // Get collaborations where user is a collaborator
    const userCollaborations = await db
      .select()
      .from(collaborators)
      .where(eq(collaborators.userId, targetUser.id));
      
    // Also get collaborations on user's notes (where they are the owner)
    const ownedNoteIds = userNotes.map(n => n.id);
    let noteCollaborations: any[] = [];
    if (ownedNoteIds.length > 0) {
      noteCollaborations = await db
        .select()
        .from(collaborators)
        .where(inArray(collaborators.noteId, ownedNoteIds));
    }
    
    // Combine both types of collaborations
    const allCollaborations = [...userCollaborations, ...noteCollaborations];
      
    progress.setPhase('Fetching AI usage');
    const userAiUsage = await db
      .select()
      .from(aiUsage)
      .where(eq(aiUsage.userId, targetUser.id));
      
    progress.setPhase('Fetching preferences');
    const [userPref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, targetUser.id));
      
    progress.setPhase('Fetching subscription');
    const [userSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, targetUser.id));
    
    // Process notes with metadata
    progress.setPhase('Processing notes');
    progress.setTotal(userNotes.length);
    
    const processedNotes: BackupNote[] = userNotes.map(note => {
      progress.increment(note.title);
      return {
        ...note,
        metadata: {
          backupTimestamp: new Date().toISOString(),
          originalPath: buildFolderPath(note.folderId, userFolders),
          size: JSON.stringify(note.content).length
        }
      };
    });
    
    // Process folders with child count
    progress.setPhase('Processing folders');
    progress.setTotal(userFolders.length);
    
    const processedFolders: BackupFolder[] = userFolders.map(folder => {
      progress.increment(folder.name);
      const childCount = userFolders.filter(f => f.parentId === folder.id).length;
      return {
        ...folder,
        childCount
      };
    });
    
    // Count deleted items
    const deletedNotes = processedNotes.filter(n => n.deletedAt !== null).length;
    const deletedFolders = processedFolders.filter(f => f.deletedAt !== null).length;
    
    // Create backup object
    progress.setPhase('Creating backup file');
    const backup: BackupFile = {
      version: BACKUP_VERSION,
      backupDate: new Date().toISOString(),
      userEmail: targetUser.email,
      userId: targetUser.id,
      metadata: {
        totalNotes: processedNotes.length,
        totalFolders: processedFolders.length,
        totalTimeBlocks: userTimeBlocks.length,
        deletedItems: {
          notes: deletedNotes,
          folders: deletedFolders
        }
      },
      data: {
        user: targetUser,
        notes: processedNotes,
        folders: processedFolders,
        timeBlocks: userTimeBlocks,
        collaborations: allCollaborations,
        aiUsage: userAiUsage,
        preferences: userPref || null,
        subscription: userSub || null
      }
    };
    
    // Create output directory if it doesn't exist
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `backup-${userEmail.replace('@', '-at-')}-${timestamp}`;
    const filename = shouldCompress ? `${baseFilename}.json.gz` : `${baseFilename}.json`;
    const filepath = join(outputDir, filename);
    
    // Write backup file
    progress.setPhase('Writing backup');
    const backupJson = JSON.stringify(backup, null, 2);
    
    if (shouldCompress) {
      const compressed = gzipSync(backupJson);
      writeFileSync(filepath, compressed);
      console.log(`\nBackup compressed from ${(backupJson.length / 1024).toFixed(2)}KB to ${(compressed.length / 1024).toFixed(2)}KB`);
    } else {
      writeFileSync(filepath, backupJson);
    }
    
    // Summary
    console.log('\n=== Backup Summary ===');
    console.log(`User: ${targetUser.name || 'Unknown'} (${targetUser.email})`);
    console.log(`Notes: ${processedNotes.length} (${deletedNotes} deleted)`);
    console.log(`Folders: ${processedFolders.length} (${deletedFolders} deleted)`);
    console.log(`Time Blocks: ${userTimeBlocks.length}`);
    console.log(`Collaborations: ${allCollaborations.length}`);
    console.log(`AI Usage Records: ${userAiUsage.length}`);
    console.log(`Backup saved to: ${filepath}`);
    
    if (isIncremental) {
      console.log(`\nIncremental backup: Only items modified since ${since?.toISOString() || 'N/A'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

// Run backup
backupUserData();