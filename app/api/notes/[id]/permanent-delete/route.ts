import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export async function DELETE(
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

    // Permanently delete the note - only if it's already in trash
    const [deleted] = await db
      .delete(notes)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, session.user.id),
          isNotNull(notes.deletedAt)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Note not found in trash' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to permanently delete note' },
      { status: 500 }
    );
  }
}