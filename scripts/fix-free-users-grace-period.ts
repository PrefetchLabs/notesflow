import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { eq, and } from 'drizzle-orm';

async function fixFreeUsersGracePeriod() {
  try {
    console.log('Fixing grace period flags for free users...');
    
    // Update all free plan subscriptions to ensure grace period is false
    const result = await db
      .update(subscriptions)
      .set({
        isInGracePeriod: false,
        gracePeriodEnd: null,
        isNewUser: false,
        newUserGracePeriodEnd: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.plan, 'free'),
          eq(subscriptions.isInGracePeriod, true)
        )
      );
    
    console.log('✅ Fixed grace period flags for free users');
    
    // Also fix any free users that still have isNewUser set to true
    const newUserResult = await db
      .update(subscriptions)
      .set({
        isNewUser: false,
        newUserGracePeriodEnd: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.plan, 'free'),
          eq(subscriptions.isNewUser, true)
        )
      );
    
    console.log('✅ Fixed new user flags for free users');
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

fixFreeUsersGracePeriod();