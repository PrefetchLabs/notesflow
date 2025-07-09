import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, folders } from '@/lib/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { getTableColumns } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the 5 most recently accessed notes
    const recentNotes = await db
      .select({
        ...getTableColumns(notes),
        folder: {
          id: folders.id,
          name: folders.name,
        },
      })
      .from(notes)
      .leftJoin(folders, eq(notes.folderId, folders.id))
      .where(
        and(
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt)
        )
      )
      .orderBy(desc(notes.lastAccessedAt))
      .limit(5);

    return NextResponse.json({ notes: recentNotes });
  } catch (error) {
    console.error('Error fetching recent notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent notes' },
      { status: 500 }
    );
  }
}