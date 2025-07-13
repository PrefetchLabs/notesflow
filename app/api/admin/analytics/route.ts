import { NextRequest, NextResponse } from 'next/server';
import { requireSystemAdmin } from '@/lib/auth/admin-check';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';
import { notes } from '@/lib/db/schema/notes';
import { aiUsage } from '@/lib/db/schema/aiUsage';
import { subscriptions } from '@/lib/db/schema';
import { sql, gte, lt, and, eq } from 'drizzle-orm';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  // Check admin permissions
  const adminCheck = await requireSystemAdmin();
  if ('error' in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    // Get user growth data for last 6 months
    const userGrowthData = [];
    const monthLabels = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(lt(user.createdAt, monthEnd));
      
      userGrowthData.push(Number(result?.count || 0));
      monthLabels.push(monthStart.toLocaleDateString('en-US', { month: 'short' }));
    }

    // Get AI usage by subscription tier
    const aiUsageByTier = await db
      .select({
        plan: subscriptions.plan,
        totalCalls: sql<number>`count(${aiUsage.id})`,
      })
      .from(aiUsage)
      .innerJoin(subscriptions, eq(aiUsage.userId, subscriptions.userId))
      .groupBy(subscriptions.plan);

    // Get subscription distribution
    const subscriptionDist = await db
      .select({
        plan: subscriptions.plan,
        count: sql<number>`count(*)`,
      })
      .from(subscriptions)
      .groupBy(subscriptions.plan);

    // Format data for charts
    const formattedAIUsage = {
      labels: ['Free', 'Beta', 'Pro Monthly', 'Pro Yearly', 'Admin'],
      datasets: [{
        label: 'AI Calls',
        data: [
          aiUsageByTier.find(t => t.plan === 'free')?.totalCalls || 0,
          aiUsageByTier.find(t => t.plan === 'beta')?.totalCalls || 0,
          aiUsageByTier.find(t => t.plan === 'pro_monthly')?.totalCalls || 0,
          aiUsageByTier.find(t => t.plan === 'pro_yearly')?.totalCalls || 0,
          aiUsageByTier.find(t => t.plan === 'early_bird')?.totalCalls || 0,
        ],
        backgroundColor: [
          'rgba(234, 179, 8, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      }],
    };

    const formattedSubscriptionDist = {
      labels: subscriptionDist.map(s => s.plan || 'Unknown'),
      datasets: [{
        data: subscriptionDist.map(s => Number(s.count)),
        backgroundColor: [
          'rgba(234, 179, 8, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      }],
    };

    return NextResponse.json({
      userGrowth: {
        labels: monthLabels,
        datasets: [{
          label: 'Total Users',
          data: userGrowthData,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
        }],
      },
      aiUsageByTier: formattedAIUsage,
      subscriptionDistribution: formattedSubscriptionDist,
      recentActivity: [
        { description: 'New user signed up', time: '2 minutes ago' },
        { description: 'Pro subscription activated', time: '15 minutes ago' },
        { description: '50 AI calls processed', time: '1 hour ago' },
        { description: 'Beta trial started', time: '3 hours ago' },
        { description: 'New note created', time: '5 hours ago' },
      ],
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}