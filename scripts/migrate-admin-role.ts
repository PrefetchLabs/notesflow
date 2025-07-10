import { db } from '../lib/db';
import { user } from '../lib/db/schema/auth';
import { eq, sql } from 'drizzle-orm';

async function migrateAdminRoles() {
  console.log('Starting admin role migration...');
  
  try {
    // First, update any user with is_system_admin=true to have role='system_admin'
    const result = await db
      .update(user)
      .set({ role: 'system_admin' })
      .where(sql`${user.isSystemAdmin} = true`);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateAdminRoles();