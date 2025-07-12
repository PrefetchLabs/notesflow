import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { eq, and, lte } from 'drizzle-orm';

export async function checkAndExpireBetaPlans() {
  try {
    const now = new Date();
    
    // Find all beta subscriptions
    const betaSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.plan, 'beta'));
    
    for (const subscription of betaSubscriptions) {
      const betaEndDate = subscription.metadata?.betaEndDate 
        ? new Date(subscription.metadata.betaEndDate as string) 
        : null;
      
      // If beta period has expired
      if (betaEndDate && now > betaEndDate) {
        // [REMOVED_CONSOLE]
        
        // Revert to previous plan or free
        const previousPlan = subscription.metadata?.previousPlan || 'free';
        
        await db
          .update(subscriptions)
          .set({
            plan: previousPlan as any,
            limits: {
              maxNotes: 10,
              maxFolders: 3,
              maxAiCalls: 0,
              maxCollaborators: 0,
              maxStorage: 100,
            },
            metadata: {
              ...subscription.metadata,
              betaExpiredAt: now.toISOString(),
            },
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscription.id));
        
        // [REMOVED_CONSOLE]
      }
    }
  } catch (error) {
    // [REMOVED_CONSOLE]
  }
}

// This function should be called periodically (e.g., daily via cron job or API route)