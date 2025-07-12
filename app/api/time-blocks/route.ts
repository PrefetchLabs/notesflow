import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { timeBlocks } from '@/lib/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withTimeout, QUERY_TIMEOUTS } from '@/lib/db/query-timeout';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    const blocks = await withTimeout(
      db
        .select()
        .from(timeBlocks)
        .where(
          and(
            eq(timeBlocks.userId, session.user.id),
            gte(timeBlocks.startTime, new Date(startDate)),
            lte(timeBlocks.startTime, new Date(endDate))
          )
        )
        .orderBy(timeBlocks.startTime),
      QUERY_TIMEOUTS.DEFAULT
    );

    return NextResponse.json({ blocks });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to fetch time blocks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, startTime, endTime, color, icon, noteId, type } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const [block] = await withTimeout(
      db
        .insert(timeBlocks)
        .values({
          id: nanoid(),
          userId: session.user.id,
          title,
          startTime: start,
          endTime: end,
          color: color || '#3B82F6',
          icon: icon || null,
          noteId: noteId || null,
          isCompleted: false,
          type: type || 'event',
        })
        .returning(),
      QUERY_TIMEOUTS.DEFAULT
    );

    return NextResponse.json({ block });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to create time block' },
      { status: 500 }
    );
  }
}