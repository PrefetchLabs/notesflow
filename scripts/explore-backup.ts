#!/usr/bin/env bun
import { readFileSync, existsSync } from 'fs';
import { gunzipSync } from 'zlib';
import { 
  BackupFile, 
  validateBackupFile,
  formatFileSize,
  buildFolderPath
} from '@/lib/backup/utils';

// Parse command line arguments
const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
const listIndex = args.indexOf('--list');
const searchIndex = args.indexOf('--search');
const statsIndex = args.indexOf('--stats');
const detailIndex = args.indexOf('--detail');
const jsonIndex = args.indexOf('--json');

if (fileIndex === -1 || fileIndex === args.length - 1) {
  console.error('Usage: bun run scripts/explore-backup.ts --file <backup-file> [options]');
  console.error('\nOptions:');
  console.error('  --list <notes|folders|all>    List items of specified type');
  console.error('  --search <pattern>            Search for items matching pattern');
  console.error('  --stats                       Show backup statistics');
  console.error('  --detail <item-id>            Show detailed info for specific item');
  console.error('  --json                        Output in JSON format');
  process.exit(1);
}

const backupFile = args[fileIndex + 1];
const listType = listIndex !== -1 && listIndex < args.length - 1 ? args[listIndex + 1] : null;
const searchPattern = searchIndex !== -1 && searchIndex < args.length - 1 ? args[searchIndex + 1] : null;
const showStats = statsIndex !== -1;
const detailId = detailIndex !== -1 && detailIndex < args.length - 1 ? args[detailIndex + 1] : null;
const outputJson = jsonIndex !== -1;

async function exploreBackup() {
  try {
    // Check if backup file exists
    if (!existsSync(backupFile)) {
      console.error(`Backup file not found: ${backupFile}`);
      process.exit(1);
    }

    // Read and parse backup file
    let backupContent: string;
    
    if (backupFile.endsWith('.gz')) {
      const compressed = readFileSync(backupFile);
      backupContent = gunzipSync(compressed).toString();
    } else {
      backupContent = readFileSync(backupFile, 'utf-8');
    }
    
    const backup: BackupFile = validateBackupFile(JSON.parse(backupContent));
    
    // Show stats
    if (showStats) {
      const stats = {
        version: backup.version,
        backupDate: backup.backupDate,
        userEmail: backup.userEmail,
        totalNotes: backup.metadata.totalNotes,
        totalFolders: backup.metadata.totalFolders,
        totalTimeBlocks: backup.metadata.totalTimeBlocks,
        deletedNotes: backup.metadata.deletedItems.notes,
        deletedFolders: backup.metadata.deletedItems.folders,
        totalSize: formatFileSize(backupContent.length),
        notesByFolder: {} as Record<string, number>,
        largestNotes: [] as any[]
      };
      
      // Calculate notes by folder
      backup.data.notes.forEach(note => {
        const folderPath = buildFolderPath(note.folderId, backup.data.folders);
        stats.notesByFolder[folderPath] = (stats.notesByFolder[folderPath] || 0) + 1;
      });
      
      // Find largest notes
      stats.largestNotes = backup.data.notes
        .sort((a, b) => (b.metadata?.size || 0) - (a.metadata?.size || 0))
        .slice(0, 5)
        .map(n => ({
          title: n.title,
          size: formatFileSize(n.metadata?.size || 0),
          path: n.metadata?.originalPath || '/'
        }));
      
      if (outputJson) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log('=== Backup Statistics ===');
        console.log(`Version: ${stats.version}`);
        console.log(`Backup Date: ${stats.backupDate}`);
        console.log(`User: ${stats.userEmail}`);
        console.log(`Total Size: ${stats.totalSize}`);
        console.log(`\nContent Summary:`);
        console.log(`- Notes: ${stats.totalNotes} (${stats.deletedNotes} deleted)`);
        console.log(`- Folders: ${stats.totalFolders} (${stats.deletedFolders} deleted)`);
        console.log(`- Time Blocks: ${stats.totalTimeBlocks}`);
        console.log(`\nNotes by Folder:`);
        Object.entries(stats.notesByFolder)
          .sort(([, a], [, b]) => b - a)
          .forEach(([folder, count]) => {
            console.log(`  ${folder}: ${count} notes`);
          });
        console.log(`\nLargest Notes:`);
        stats.largestNotes.forEach(note => {
          console.log(`  - ${note.title} (${note.size}) in ${note.path}`);
        });
      }
      return;
    }
    
    // List items
    if (listType) {
      const items: any[] = [];
      
      if (listType === 'notes' || listType === 'all') {
        backup.data.notes.forEach(note => {
          items.push({
            type: 'note',
            id: note.id,
            title: note.title,
            path: note.metadata?.originalPath || '/',
            size: formatFileSize(note.metadata?.size || 0),
            created: note.createdAt,
            updated: note.updatedAt,
            deleted: note.deletedAt || null,
            tags: note.tags || []
          });
        });
      }
      
      if (listType === 'folders' || listType === 'all') {
        backup.data.folders.forEach(folder => {
          items.push({
            type: 'folder',
            id: folder.id,
            name: folder.name,
            path: folder.path,
            childCount: folder.childCount || 0,
            created: folder.createdAt,
            updated: folder.updatedAt
          });
        });
      }
      
      if (outputJson) {
        console.log(JSON.stringify(items, null, 2));
      } else {
        console.log(`=== ${listType.charAt(0).toUpperCase() + listType.slice(1)} ===`);
        items.forEach(item => {
          if (item.type === 'note') {
            console.log(`\n[Note] ${item.title}`);
            console.log(`  ID: ${item.id}`);
            console.log(`  Path: ${item.path}`);
            console.log(`  Size: ${item.size}`);
            console.log(`  Updated: ${item.updated}`);
            if (item.deleted) console.log(`  DELETED: ${item.deleted}`);
            if (item.tags.length > 0) console.log(`  Tags: ${item.tags.join(', ')}`);
          } else {
            console.log(`\n[Folder] ${item.name}`);
            console.log(`  ID: ${item.id}`);
            console.log(`  Path: ${item.path}`);
            console.log(`  Contains: ${item.childCount} subfolders`);
          }
        });
      }
      return;
    }
    
    // Search items
    if (searchPattern) {
      const regex = new RegExp(searchPattern, 'i');
      const results: any[] = [];
      
      // Search notes
      backup.data.notes.forEach(note => {
        if (regex.test(note.title) || regex.test(JSON.stringify(note.content))) {
          results.push({
            type: 'note',
            id: note.id,
            title: note.title,
            path: note.metadata?.originalPath || '/',
            matches: []
          });
          
          if (regex.test(note.title)) {
            results[results.length - 1].matches.push('title');
          }
          if (regex.test(JSON.stringify(note.content))) {
            results[results.length - 1].matches.push('content');
          }
        }
      });
      
      // Search folders
      backup.data.folders.forEach(folder => {
        if (regex.test(folder.name) || regex.test(folder.path)) {
          results.push({
            type: 'folder',
            id: folder.id,
            name: folder.name,
            path: folder.path,
            matches: []
          });
          
          if (regex.test(folder.name)) {
            results[results.length - 1].matches.push('name');
          }
          if (regex.test(folder.path)) {
            results[results.length - 1].matches.push('path');
          }
        }
      });
      
      if (outputJson) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(`=== Search Results for "${searchPattern}" ===`);
        console.log(`Found ${results.length} matches\n`);
        
        results.forEach(result => {
          if (result.type === 'note') {
            console.log(`[Note] ${result.title}`);
            console.log(`  Path: ${result.path}`);
            console.log(`  Matches in: ${result.matches.join(', ')}`);
          } else {
            console.log(`[Folder] ${result.name}`);
            console.log(`  Path: ${result.path}`);
            console.log(`  Matches in: ${result.matches.join(', ')}`);
          }
          console.log();
        });
      }
      return;
    }
    
    // Show item detail
    if (detailId) {
      const note = backup.data.notes.find(n => n.id === detailId);
      const folder = backup.data.folders.find(f => f.id === detailId);
      
      if (note) {
        const detail = {
          type: 'note',
          ...note,
          contentPreview: JSON.stringify(note.content).substring(0, 200) + '...'
        };
        
        if (outputJson) {
          console.log(JSON.stringify(detail, null, 2));
        } else {
          console.log(`=== Note Details ===`);
          console.log(`Title: ${note.title}`);
          console.log(`ID: ${note.id}`);
          console.log(`Path: ${note.metadata?.originalPath || '/'}`);
          console.log(`Size: ${formatFileSize(note.metadata?.size || 0)}`);
          console.log(`Created: ${note.createdAt}`);
          console.log(`Updated: ${note.updatedAt}`);
          console.log(`Deleted: ${note.deletedAt || 'No'}`);
          console.log(`Tags: ${note.tags?.join(', ') || 'None'}`);
          console.log(`Pinned: ${note.isPinned ? 'Yes' : 'No'}`);
          console.log(`Archived: ${note.isArchived ? 'Yes' : 'No'}`);
          console.log(`\nContent Preview:`);
          console.log(detail.contentPreview);
        }
      } else if (folder) {
        const childFolders = backup.data.folders.filter(f => f.parentId === folder.id);
        const childNotes = backup.data.notes.filter(n => n.folderId === folder.id);
        
        const detail = {
          type: 'folder',
          ...folder,
          childFolders: childFolders.map(f => ({ id: f.id, name: f.name })),
          childNotes: childNotes.map(n => ({ id: n.id, title: n.title }))
        };
        
        if (outputJson) {
          console.log(JSON.stringify(detail, null, 2));
        } else {
          console.log(`=== Folder Details ===`);
          console.log(`Name: ${folder.name}`);
          console.log(`ID: ${folder.id}`);
          console.log(`Path: ${folder.path}`);
          console.log(`Created: ${folder.createdAt}`);
          console.log(`Updated: ${folder.updatedAt}`);
          console.log(`\nContains:`);
          console.log(`- ${childFolders.length} subfolders`);
          console.log(`- ${childNotes.length} notes`);
          
          if (childFolders.length > 0) {
            console.log(`\nSubfolders:`);
            childFolders.forEach(f => console.log(`  - ${f.name}`));
          }
          
          if (childNotes.length > 0) {
            console.log(`\nNotes:`);
            childNotes.forEach(n => console.log(`  - ${n.title}`));
          }
        }
      } else {
        console.error(`Item not found: ${detailId}`);
        process.exit(1);
      }
      return;
    }
    
    // Default: show basic info
    console.log(`Backup File: ${backupFile}`);
    console.log(`Version: ${backup.version}`);
    console.log(`Date: ${backup.backupDate}`);
    console.log(`User: ${backup.userEmail}`);
    console.log(`\nContains:`);
    console.log(`- ${backup.metadata.totalNotes} notes`);
    console.log(`- ${backup.metadata.totalFolders} folders`);
    console.log(`- ${backup.metadata.totalTimeBlocks} time blocks`);
    console.log(`\nUse --help to see available options`);
    
  } catch (error) {
    console.error('Failed to explore backup:', error);
    process.exit(1);
  }
}

// Run explorer
exploreBackup();