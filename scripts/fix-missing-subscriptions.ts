import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { user } from '@/lib/db/schema/auth';
import { eq, isNull, sql } from 'drizzle-orm';
import { addDays } from 'date-fns';

async function fixMissingSubscriptions() {
  console.log('Checking for users without subscription records...');
  
  try {
    // Find users without subscriptions
    const usersWithoutSubscriptions = await db
      .select({ 
        id: user.id, 
        email: user.email,
        role: user.role,
        createdAt: user.createdAt 
      })
      .from(user)
      .leftJoin(subscriptions, eq(user.id, subscriptions.userId))
      .where(isNull(subscriptions.id));
    
    console.log(`Found ${usersWithoutSubscriptions.length} users without subscriptions`);
    
    // Create subscriptions for users that don't have them
    for (const u of usersWithoutSubscriptions) {
      // Skip admin users - they don't need subscription records
      if (u.role === 'admin') {
        console.log(`Skipping admin user: ${u.email}`);
        continue;
      }
      
      const now = new Date();
      const userCreatedAt = new Date(u.createdAt);
      const daysSinceCreation = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // If user was created less than 7 days ago, give them the grace period
      const isNewUser = daysSinceCreation < 7;
      const gracePeriodEnd = isNewUser ? addDays(userCreatedAt, 7) : null;
      
      console.log(`Creating subscription for user: ${u.email} (${isNewUser ? 'new user' : 'existing user'})`);
      
      await db.insert(subscriptions).values({
        id: crypto.randomUUID(),
        userId: u.id,
        plan: 'free',
        status: 'active',
        isNewUser,
        newUserGracePeriodEnd: gracePeriodEnd,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    console.log('Done! All users now have subscription records.');
  } catch (error) {
    console.error('Error fixing subscriptions:', error);
    process.exit(1);
  }
}

// Run the script
fixMissingSubscriptions();