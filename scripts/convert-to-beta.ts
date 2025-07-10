import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { user } from '@/lib/db/schema/auth';
import { eq } from 'drizzle-orm';
import { addDays } from 'date-fns';

async function convertUserToBeta(email: string) {
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
    
    console.log(`Found user: ${foundUser.email}`);
    
    // Find or create subscription
    let [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, foundUser.id));
    
    const now = new Date();
    const betaEndDate = addDays(now, 7); // 7 days of beta access
    
    if (!subscription) {
      // Create new beta subscription
      console.log('Creating new beta subscription...');
      await db.insert(subscriptions).values({
        id: crypto.randomUUID(),
        userId: foundUser.id,
        plan: 'beta',
        status: 'active',
        limits: {
          maxNotes: 50,
          maxFolders: 10,
          maxAiCalls: 100,
          maxCollaborators: 2,
          maxStorage: 500,
        },
        metadata: {
          betaStartDate: now.toISOString(),
          betaEndDate: betaEndDate.toISOString(),
        },
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update existing subscription to beta
      console.log('Converting existing subscription to beta...');
      await db
        .update(subscriptions)
        .set({
          plan: 'beta',
          limits: {
            maxNotes: 50,
            maxFolders: 10,
            maxAiCalls: 100,
            maxCollaborators: 2,
            maxStorage: 500,
          },
          metadata: {
            ...subscription.metadata,
            betaStartDate: now.toISOString(),
            betaEndDate: betaEndDate.toISOString(),
            previousPlan: subscription.plan,
          },
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id));
    }
    
    console.log(`✅ Successfully converted ${email} to beta tester!`);
    console.log(`Beta access expires on: ${betaEndDate.toLocaleDateString()}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage: bun run scripts/convert-to-beta.ts user@email.com
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  console.error('Usage: bun run scripts/convert-to-beta.ts user@email.com');
  process.exit(1);
}

convertUserToBeta(email);