import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { user } from '@/lib/db/schema/auth';
import { eq } from 'drizzle-orm';

async function checkUserSubscription(email: string) {
  try {
    // Find user
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));
    
    if (!foundUser) {
      console.log(`User not found: ${email}`);
      return;
    }
    
    console.log(`\nUser found:`);
    console.log(`- ID: ${foundUser.id}`);
    console.log(`- Email: ${foundUser.email}`);
    console.log(`- Role: ${foundUser.role}`);
    console.log(`- Created: ${foundUser.createdAt}`);
    
    // Find subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, foundUser.id));
    
    if (!subscription) {
      console.log(`\n❌ No subscription found for user`);
      return;
    }
    
    console.log(`\nSubscription found:`);
    console.log(`- Plan: ${subscription.plan}`);
    console.log(`- Status: ${subscription.status}`);
    console.log(`- Is New User: ${subscription.isNewUser}`);
    console.log(`- New User Grace Period End: ${subscription.newUserGracePeriodEnd}`);
    console.log(`- Is In Grace Period: ${subscription.isInGracePeriod}`);
    console.log(`- Grace Period End: ${subscription.gracePeriodEnd}`);
    console.log(`- Created: ${subscription.createdAt}`);
    
    // Check if grace periods should be cleared
    const now = new Date();
    const userCreatedAt = new Date(foundUser.createdAt);
    const daysSinceCreation = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`\nUser created ${daysSinceCreation} days ago`);
    
    if (daysSinceCreation > 7 && (subscription.isNewUser || subscription.newUserGracePeriodEnd)) {
      console.log(`\n⚠️  User is marked as new user but was created more than 7 days ago`);
      console.log(`This should be fixed.`);
      
      // Fix the subscription
      await db
        .update(subscriptions)
        .set({
          isNewUser: false,
          newUserGracePeriodEnd: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));
      
      console.log(`✅ Fixed subscription - removed new user grace period`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check specific user
const email = process.argv[2] || 'samid.tennakoon@gmail.com';
console.log(`Checking subscription for: ${email}`);
checkUserSubscription(email);