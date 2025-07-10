import { NextRequest, NextResponse } from 'next/server';
import { requireSystemAdmin } from '@/lib/auth/admin-check';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';
import { notes } from '@/lib/db/schema/notes';
import { folders } from '@/lib/db/schema/folders';
import { sql, gt, and, gte, lte } from 'drizzle-orm';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  // Check admin permissions
  const adminCheck = await requireSystemAdmin();
  if ('error' in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    // Get user stats
    const userCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user);
    const totalUsers = Number(userCountResult[0]?.count || 0);

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const activeUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gt(user.updatedAt, thirtyDaysAgo));
    const activeUsers = Number(activeUsersResult[0]?.count || 0);

    // Get notes stats
    const notesCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes);
    const totalNotes = Number(notesCountResult[0]?.count || 0);

    // Get folders count
    const foldersCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(folders);
    const totalFolders = Number(foldersCountResult[0]?.count || 0);

    // Get new users today
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const newUsersTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(
        and(
          gte(user.createdAt, todayStart),
          lte(user.createdAt, todayEnd)
        )
      );
    const newUsersToday = Number(newUsersTodayResult[0]?.count || 0);

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalNotes,
        totalFolders,
        newUsersToday,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}