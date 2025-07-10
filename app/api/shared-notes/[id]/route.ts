import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notes, collaborators } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Update shared note content (for anonymous users)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;
    const { content, anonymousUserId } = await request.json();

    // Verify the note is publicly shared
    const [publicAccess] = await db
      .select()
      .from(collaborators)
      .where(and(
        eq(collaborators.noteId, noteId),
        eq(collaborators.userId, 'public-access')
      ))
      .limit(1);

    if (!publicAccess) {
      return new NextResponse('Note is not publicly shared', { status: 403 });
    }

    // Update the note content
    await db.update(notes)
      .set({
        content,
        updatedAt: new Date(),
        lastEditedBy: anonymousUserId, // Track anonymous user ID
      })
      .where(eq(notes.id, noteId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating shared note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Get shared note (for anonymous users)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteId } = await params;

    // Verify the note is publicly shared
    const [publicAccess] = await db
      .select()
      .from(collaborators)
      .where(and(
        eq(collaborators.noteId, noteId),
        eq(collaborators.userId, 'public-access')
      ))
      .limit(1);

    if (!publicAccess) {
      return new NextResponse('Note is not publicly shared', { status: 403 });
    }

    // Get the note
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return new NextResponse('Note not found', { status: 404 });
    }

    return NextResponse.json({
      id: note.id,
      title: note.title,
      content: note.content,
    });
  } catch (error) {
    console.error('Error getting shared note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}