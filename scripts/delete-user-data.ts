#!/usr/bin/env bun
import { db } from '@/lib/db';
import { 
  user, 
  session,
  account,
  notes, 
  folders, 
  timeBlocks, 
  collaborators, 
  aiUsage, 
  subscriptions,
  userPreferences 
} from '@/lib/db/schema';
import { eq, and, or, isNotNull, inArray, sql } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// Create Supabase client for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse command line arguments
const args = process.argv.slice(2);
const emailIndex = args.indexOf('--email');
const forceIndex = args.indexOf('--force');
const verboseIndex = args.indexOf('--verbose');
const backupIndex = args.indexOf('--backup');

if (emailIndex === -1 || emailIndex === args.length - 1) {
  console.error('Usage: bun run scripts/delete-user-data.ts --email <email> [--force] [--verbose] [--backup]');
  console.error('\nOptions:');
  console.error('  --email <email>  Email of the user to delete (required)');
  console.error('  --force          Actually perform the deletion (default is dry-run)');
  console.error('  --verbose        Show detailed progress information');
  console.error('  --backup         Create a backup before deletion (only with --force)');
  process.exit(1);
}

const userEmail = args[emailIndex + 1];
const isForce = forceIndex !== -1;
const isVerbose = verboseIndex !== -1;
const shouldBackup = backupIndex !== -1;

// Helper function to prompt for confirmation
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Helper to log verbose messages
function log(message: string, always = false) {
  if (isVerbose || always) {
    console.log(message);
  }
}

async function deleteUserData() {
  try {
    console.log(`\n${isForce ? '🗑️  DELETING' : '🔍 DRY RUN - Checking'} data for user: ${userEmail}`);
    
    // Find user by email
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, userEmail));
      
    if (!targetUser) {
      console.error(`\n❌ User not found: ${userEmail}`);
      process.exit(1);
    }
    
    console.log(`\n✅ Found user: ${targetUser.name || 'Unknown'} (ID: ${targetUser.id})`);
    console.log(`   Created: ${targetUser.createdAt}`);
    console.log(`   Role: ${targetUser.role}`);
    
    // Confirm deletion if force mode
    if (isForce) {
      console.log('\n⚠️  WARNING: This will permanently delete all user data!');
      const confirmed = await confirm('Are you sure you want to proceed?');
      if (!confirmed) {
        console.log('\n❌ Deletion cancelled');
        process.exit(0);
      }
    }
    
    // Create backup if requested
    if (isForce && shouldBackup) {
      console.log('\n📦 Creating backup...');
      const { execSync } = await import('child_process');
      try {
        execSync(`bun run scripts/backup-user-data.ts --email ${userEmail} --compress`, { stdio: 'inherit' });
        console.log('✅ Backup created successfully');
      } catch (error) {
        console.error('❌ Backup failed:', error);
        const proceed = await confirm('Backup failed. Continue with deletion anyway?');
        if (!proceed) {
          process.exit(1);
        }
      }
    }
    
    // Initialize counters
    let deletedCounts = {
      aiUsage: 0,
      collaborations: 0,
      timeBlocks: 0,
      notes: 0,
      folders: 0,
      preferences: 0,
      subscriptions: 0,
      storageFiles: 0,
      sessions: 0,
      accounts: 0,
    };
    
    // Start transaction for database operations
    await db.transaction(async (tx) => {
      // 1. Delete AI Usage Records
      log('\n📊 Checking AI usage records...');
      const aiUsageRecords = await tx
        .select({ id: aiUsage.id })
        .from(aiUsage)
        .where(eq(aiUsage.userId, targetUser.id));
      
      deletedCounts.aiUsage = aiUsageRecords.length;
      log(`   Found ${deletedCounts.aiUsage} AI usage records`);
      
      if (isForce && deletedCounts.aiUsage > 0) {
        await tx.delete(aiUsage).where(eq(aiUsage.userId, targetUser.id));
        log('   ✅ Deleted AI usage records');
      }
      
      // 2. Delete Collaborations
      log('\n👥 Checking collaborations...');
      
      // Get user's notes for collaboration check
      const userNotes = await tx
        .select({ id: notes.id })
        .from(notes)
        .where(eq(notes.userId, targetUser.id));
      
      const noteIds = userNotes.map(n => n.id);
      
      // Delete collaborations where user is a collaborator
      const userCollabs = await tx
        .select({ id: collaborators.id })
        .from(collaborators)
        .where(eq(collaborators.userId, targetUser.id));
      
      // Delete collaborations on user's notes
      let noteCollabs: any[] = [];
      if (noteIds.length > 0) {
        noteCollabs = await tx
          .select({ id: collaborators.id })
          .from(collaborators)
          .where(inArray(collaborators.noteId, noteIds));
      }
      
      deletedCounts.collaborations = userCollabs.length + noteCollabs.length;
      log(`   Found ${userCollabs.length} collaborations as collaborator`);
      log(`   Found ${noteCollabs.length} collaborations on owned notes`);
      
      if (isForce) {
        if (userCollabs.length > 0) {
          await tx.delete(collaborators).where(eq(collaborators.userId, targetUser.id));
        }
        if (noteIds.length > 0) {
          await tx.delete(collaborators).where(inArray(collaborators.noteId, noteIds));
        }
        log('   ✅ Deleted collaborations');
      }
      
      // 3. Delete Time Blocks
      log('\n📅 Checking time blocks...');
      const timeBlockRecords = await tx
        .select({ id: timeBlocks.id })
        .from(timeBlocks)
        .where(eq(timeBlocks.userId, targetUser.id));
      
      deletedCounts.timeBlocks = timeBlockRecords.length;
      log(`   Found ${deletedCounts.timeBlocks} time blocks`);
      
      if (isForce && deletedCounts.timeBlocks > 0) {
        await tx.delete(timeBlocks).where(eq(timeBlocks.userId, targetUser.id));
        log('   ✅ Deleted time blocks');
      }
      
      // 4. Delete Notes
      log('\n📝 Checking notes...');
      deletedCounts.notes = userNotes.length;
      log(`   Found ${deletedCounts.notes} notes`);
      
      if (isForce && deletedCounts.notes > 0) {
        await tx.delete(notes).where(eq(notes.userId, targetUser.id));
        log('   ✅ Deleted notes');
      }
      
      // 5. Delete Folders (will cascade to child folders)
      log('\n📁 Checking folders...');
      const folderRecords = await tx
        .select({ id: folders.id, name: folders.name })
        .from(folders)
        .where(eq(folders.userId, targetUser.id));
      
      deletedCounts.folders = folderRecords.length;
      log(`   Found ${deletedCounts.folders} folders`);
      
      if (isForce && deletedCounts.folders > 0) {
        await tx.delete(folders).where(eq(folders.userId, targetUser.id));
        log('   ✅ Deleted folders');
      }
      
      // 6. Delete User Preferences
      log('\n⚙️  Checking user preferences...');
      const prefRecords = await tx
        .select({ id: userPreferences.id })
        .from(userPreferences)
        .where(eq(userPreferences.userId, targetUser.id));
      
      deletedCounts.preferences = prefRecords.length;
      log(`   Found ${deletedCounts.preferences} preference records`);
      
      if (isForce && deletedCounts.preferences > 0) {
        await tx.delete(userPreferences).where(eq(userPreferences.userId, targetUser.id));
        log('   ✅ Deleted preferences');
      }
      
      // 7. Delete Subscription
      log('\n💳 Checking subscription...');
      const subRecords = await tx
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.userId, targetUser.id));
      
      deletedCounts.subscriptions = subRecords.length;
      log(`   Found ${deletedCounts.subscriptions} subscription records`);
      
      if (isForce && deletedCounts.subscriptions > 0) {
        await tx.delete(subscriptions).where(eq(subscriptions.userId, targetUser.id));
        log('   ✅ Deleted subscriptions');
      }
      
      // 8. Delete Sessions
      log('\n🔐 Checking sessions...');
      const sessionRecords = await tx
        .select({ id: session.id })
        .from(session)
        .where(eq(session.userId, targetUser.id));
      
      deletedCounts.sessions = sessionRecords.length;
      log(`   Found ${deletedCounts.sessions} sessions`);
      
      if (isForce && deletedCounts.sessions > 0) {
        await tx.delete(session).where(eq(session.userId, targetUser.id));
        log('   ✅ Deleted sessions');
      }
      
      // 9. Delete Accounts (OAuth)
      log('\n🔗 Checking OAuth accounts...');
      const accountRecords = await tx
        .select({ id: account.id, providerId: account.providerId })
        .from(account)
        .where(eq(account.userId, targetUser.id));
      
      deletedCounts.accounts = accountRecords.length;
      log(`   Found ${deletedCounts.accounts} OAuth accounts`);
      if (isVerbose && accountRecords.length > 0) {
        accountRecords.forEach(acc => {
          log(`   - Provider: ${acc.providerId}`);
        });
      }
      
      if (isForce && deletedCounts.accounts > 0) {
        await tx.delete(account).where(eq(account.userId, targetUser.id));
        log('   ✅ Deleted OAuth accounts');
      }
      
      // 10. Finally, delete the user
      if (isForce) {
        log('\n👤 Deleting user record...');
        await tx.delete(user).where(eq(user.id, targetUser.id));
        log('   ✅ Deleted user');
      }
    });
    
    // 11. Delete Storage Assets (outside transaction)
    log('\n🖼️  Checking storage assets...');
    try {
      // List all files in the notes-assets bucket
      let allFiles: any[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore) {
        const { data: files, error } = await supabase.storage
          .from('notes-assets')
          .list('editor-images', {
            limit,
            offset,
          });
        
        if (error) {
          console.error('   ⚠️  Error listing storage files:', error.message);
          break;
        }
        
        if (files && files.length > 0) {
          allFiles = [...allFiles, ...files];
          offset += limit;
          hasMore = files.length === limit;
        } else {
          hasMore = false;
        }
      }
      
      log(`   Found ${allFiles.length} total files in storage`);
      
      // In a real implementation, we'd need to track which files belong to which user
      // For now, we'll just report the total number
      deletedCounts.storageFiles = 0;
      
      if (isForce && allFiles.length > 0) {
        // Note: In production, you'd want to track file ownership
        // and only delete files belonging to the deleted user
        log('   ⚠️  Storage file deletion skipped - manual cleanup may be required');
      }
      
    } catch (error) {
      console.error('   ❌ Error accessing storage:', error);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(isForce ? '✅ DELETION COMPLETE' : '📊 DRY RUN SUMMARY');
    console.log('='.repeat(50));
    console.log(`User: ${targetUser.name || 'Unknown'} (${targetUser.email})`);
    console.log('\nData that would be deleted:');
    console.log(`  📝 Notes: ${deletedCounts.notes}`);
    console.log(`  📁 Folders: ${deletedCounts.folders}`);
    console.log(`  📅 Time Blocks: ${deletedCounts.timeBlocks}`);
    console.log(`  👥 Collaborations: ${deletedCounts.collaborations}`);
    console.log(`  📊 AI Usage Records: ${deletedCounts.aiUsage}`);
    console.log(`  ⚙️  Preferences: ${deletedCounts.preferences}`);
    console.log(`  💳 Subscriptions: ${deletedCounts.subscriptions}`);
    console.log(`  🔐 Sessions: ${deletedCounts.sessions}`);
    console.log(`  🔗 OAuth Accounts: ${deletedCounts.accounts}`);
    console.log(`  🖼️  Storage Files: ${deletedCounts.storageFiles} (requires manual cleanup)`);
    console.log(`  👤 User Record: 1`);
    
    if (!isForce) {
      console.log('\n💡 To actually delete this data, run with --force flag');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Operation failed:', error);
    process.exit(1);
  }
}

// Run deletion
deleteUserData();