'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { aiUsage } from '@/lib/db/schema';
import { and, eq, gte, sum, sql } from 'drizzle-orm';

const FREE_TIER_LIMIT = 10;

export async function checkAIUsageLimit() {
  const supabase = createServerActionClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get current month usage
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
        eq(aiUsage.userId, user.id),
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
  const supabase = createServerActionClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check limit before tracking
  const usageCheck = await checkAIUsageLimit();
  if (usageCheck.hasReachedLimit) {
    throw new Error('AI usage limit reached for this month');
  }

  // Track the usage
  await db.insert(aiUsage).values({
    userId: user.id,
    tokensUsed,
    commandType,
    resetAt: sql`date_trunc('month', NOW()) + interval '1 month'`,
  });

  return {
    success: true,
    remainingCalls: usageCheck.remainingCalls - 1,
  };
}