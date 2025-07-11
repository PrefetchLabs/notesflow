'use server';

import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { aiUsage, subscriptions } from '@/lib/db/schema';
import { and, eq, gte, sum, sql } from 'drizzle-orm';

const FREE_TIER_LIMIT = 10;

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

  // Pro and Beta users have unlimited AI access
  const allowedPlans = ['beta', 'pro_monthly', 'pro_yearly', 'early_bird'];
  const hasUnlimitedAccess = subscription && allowedPlans.includes(subscription.plan || '');
  
  if (hasUnlimitedAccess) {
    return {
      currentUsage: 0,
      limit: Infinity,
      hasReachedLimit: false,
      remainingCalls: Infinity,
    };
  }

  // For free tier users, check usage
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
  const hasReachedLimit = currentUsage >= FREE_TIER_LIMIT;

  return {
    currentUsage,
    limit: FREE_TIER_LIMIT,
    hasReachedLimit,
    remainingCalls: Math.max(0, FREE_TIER_LIMIT - currentUsage),
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
  await db.insert(aiUsage).values({
    userId: session.user.id,
    tokensUsed,
    commandType,
    resetAt: sql`date_trunc('month', NOW()) + interval '1 month'`,
  });

  return {
    success: true,
    remainingCalls: usageCheck.remainingCalls === Infinity ? Infinity : usageCheck.remainingCalls - 1,
  };
}