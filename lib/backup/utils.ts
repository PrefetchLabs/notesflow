import { BackupFile, BackupNote, BackupFolder, RestoreOptions } from './types';
import { createHash } from 'crypto';
import { z } from 'zod';

// Backup version for compatibility checking
export const BACKUP_VERSION = '2.0';

// Generate a hash for content comparison
export function generateContentHash(content: any): string {
  const contentString = JSON.stringify(content);
  return createHash('sha256').update(contentString).digest('hex').substring(0, 16);
}

// Parse time duration strings like "24h", "7d", "1w"
export function parseTimeDuration(duration: string): Date {
  const now = new Date();
  const match = duration.match(/^(\d+)([hdwm])$/);
  
  if (!match) {
    throw new Error('Invalid duration format. Use format like "24h", "7d", "1w", "1m"');
  }
  
  const [, amount, unit] = match;
  const value = parseInt(amount);
  
  switch (unit) {
    case 'h': // hours
      now.setHours(now.getHours() - value);
      break;
    case 'd': // days
      now.setDate(now.getDate() - value);
      break;
    case 'w': // weeks
      now.setDate(now.getDate() - (value * 7));
      break;
    case 'm': // months
      now.setMonth(now.getMonth() - value);
      break;
  }
  
  return now;
}

// Build folder path from folder hierarchy
export function buildFolderPath(folderId: string | null, folders: BackupFolder[]): string {
  if (!folderId) return '/';
  
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return '/';
  
  const path: string[] = [folder.name];
  let currentFolder = folder;
  
  while (currentFolder.parentId) {
    const parent = folders.find(f => f.id === currentFolder.parentId);
    if (!parent) break;
    path.unshift(parent.name);
    currentFolder = parent;
  }
  
  return '/' + path.join('/');
}

// Filter items based on restore options
export function filterItemsForRestore(
  backup: BackupFile,
  options: RestoreOptions
): { notes: BackupNote[], folders: BackupFolder[] } {
  let notes = [...backup.data.notes];
  let folders = [...backup.data.folders];
  
  switch (options.mode) {
    case 'note':
      notes = notes.filter(n => n.id === options.itemId || n.title === options.itemName);
      folders = []; // Don't restore folders in note mode
      break;
      
    case 'folder':
      const targetFolder = folders.find(f => f.id === options.itemId || f.name === options.itemName);
      if (targetFolder) {
        // Get folder and all its descendants
        const folderIds = new Set<string>([targetFolder.id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const folder of folders) {
            if (folder.parentId && folderIds.has(folder.parentId) && !folderIds.has(folder.id)) {
              folderIds.add(folder.id);
              changed = true;
            }
          }
        }
        folders = folders.filter(f => folderIds.has(f.id));
        // Include notes in these folders
        notes = notes.filter(n => n.folderId && folderIds.has(n.folderId));
      } else {
        folders = [];
        notes = [];
      }
      break;
      
    case 'deleted':
      const since = options.since ? parseTimeDuration(options.since) : null;
      notes = notes.filter(n => {
        if (!n.deletedAt) return false;
        if (since && new Date(n.deletedAt) < since) return false;
        return true;
      });
      folders = folders.filter(f => {
        if (!f.deletedAt) return false;
        if (since && new Date(f.deletedAt) < since) return false;
        return true;
      });
      break;
      
    case 'pattern':
      const regex = new RegExp(options.pattern || '', 'i');
      if (options.type === 'notes' || !options.type) {
        notes = notes.filter(n => regex.test(n.title));
      }
      if (options.type === 'folders' || !options.type) {
        folders = folders.filter(f => regex.test(f.name));
      }
      break;
      
    case 'timeRange':
      const sinceDate = options.since ? parseTimeDuration(options.since) : null;
      if (sinceDate) {
        notes = notes.filter(n => new Date(n.updatedAt) >= sinceDate);
        folders = folders.filter(f => new Date(f.updatedAt) >= sinceDate);
      }
      break;
  }
  
  return { notes, folders };
}

// Generate a unique name for conflicts
export function generateUniqueName(baseName: string, existingNames: string[]): string {
  let counter = 1;
  let newName = baseName;
  
  while (existingNames.includes(newName)) {
    newName = `${baseName} (Restored ${counter})`;
    counter++;
  }
  
  return newName;
}

// Validate backup file structure
export const backupFileSchema = z.object({
  version: z.string(),
  backupDate: z.string(),
  userEmail: z.string().email(),
  userId: z.string(),
  metadata: z.object({
    totalNotes: z.number(),
    totalFolders: z.number(),
    totalTimeBlocks: z.number(),
    deletedItems: z.object({
      notes: z.number(),
      folders: z.number(),
    }),
  }),
  data: z.object({
    user: z.any(),
    notes: z.array(z.any()),
    folders: z.array(z.any()),
    timeBlocks: z.array(z.any()),
    collaborations: z.array(z.any()),
    aiUsage: z.array(z.any()),
    preferences: z.any(),
    subscription: z.any(),
  }),
});

export function validateBackupFile(data: any): BackupFile {
  return backupFileSchema.parse(data);
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Create progress reporter
export function createProgressReporter(onProgress?: (progress: any) => void) {
  let current = 0;
  let total = 0;
  let phase = '';
  
  return {
    setTotal: (t: number) => { total = t; },
    setPhase: (p: string) => { 
      phase = p;
      current = 0;
      if (onProgress) onProgress({ current, total, phase });
    },
    increment: (item?: string) => {
      current++;
      if (onProgress) onProgress({ current, total, phase, item });
    },
    report: () => {
      if (onProgress) onProgress({ current, total, phase });
    }
  };
}