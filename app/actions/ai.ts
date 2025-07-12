'use server';

import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { aiUsage, subscriptions } from '@/lib/db/schema';
import { and, eq, gte, sum, sql } from 'drizzle-orm';

const FREE_TIER_LIMIT = 10;
const BETA_TIER_LIMIT = 100;

export async function checkAIUsageLimit() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session?.user) {
    throw new Error('User not authenticated');
  }

  // Check if user is admin - admins have unlimited access
  const isAdmin = session.user.role === 'admin' || session.user.role === 'system_admin';
  if (isAdmin) {
    return {
      currentUsage: 0,
      limit: Infinity,
      hasReachedLimit: false,
      remainingCalls: Infinity,
    };
  }

  // Check user's subscription
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id));

  // Pro users have unlimited AI access
  const unlimitedPlans = ['pro_monthly', 'pro_yearly', 'early_bird'];
  const hasUnlimitedAccess = subscription && unlimitedPlans.includes(subscription.plan || '');
  
  if (hasUnlimitedAccess) {
    return {
      currentUsage: 0,
      limit: Infinity,
      hasReachedLimit: false,
      remainingCalls: Infinity,
    };
  }

  // Beta users have 100 AI calls per month
  const isBeta = subscription?.plan === 'beta';
  const limit = isBeta ? BETA_TIER_LIMIT : FREE_TIER_LIMIT;

  // For free and beta tier users, check usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [usageData] = await db
    .select({
      totalRequests: sql<number>`count(*)`.as('total_requests'),
    })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, session.user.id),
        gte(aiUsage.createdAt, startOfMonth)
      )
    );

  const currentUsage = usageData?.totalRequests || 0;
  const hasReachedLimit = currentUsage >= limit;

  return {
    currentUsage,
    limit,
    hasReachedLimit,
    remainingCalls: Math.max(0, limit - currentUsage),
  };
}

export async function trackAIUsage(commandType: string, tokensUsed: number = 0) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session?.user) {
    throw new Error('User not authenticated');
  }

  // Check limit before tracking (will return unlimited for admins/pro users)
  const usageCheck = await checkAIUsageLimit();
  if (usageCheck.hasReachedLimit) {
    throw new Error('AI usage limit reached for this month');
  }

  // Track the usage (even for unlimited users for analytics)
  const newUsage = await db.insert(aiUsage).values({
    userId: session.user.id,
    tokensUsed,
    commandType,
    resetAt: sql`date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + interval '1 month'`,
  }).returning();

  console.log('[trackAIUsage] AI usage recorded:', {
    id: newUsage[0]?.id,
    userId: session.user.id,
    commandType,
  });

  return {
    success: true,
    remainingCalls: usageCheck.remainingCalls === Infinity ? Infinity : usageCheck.remainingCalls - 1,
    usageId: newUsage[0]?.id,
  };
}