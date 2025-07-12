import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Restore the note by setting deletedAt to null and isTrashed to false
    const [restored] = await db
      .update(notes)
      .set({
        deletedAt: null,
        isTrashed: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, session.user.id),
          isNotNull(notes.deletedAt)
        )
      )
      .returning();

    if (!restored) {
      return NextResponse.json({ error: 'Note not found in trash' }, { status: 404 });
    }

    return NextResponse.json({ success: true, note: restored });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to restore note' },
      { status: 500 }
    );
  }
}