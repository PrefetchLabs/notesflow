import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, collaborators } from '@/lib/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';

export async function GET(
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

    // First try to get the note
    const [note] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, id),
          isNull(notes.deletedAt)
        )
      );

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user has access (owner or collaborator)
    const isOwner = note.userId === session.user.id;
    
    if (!isOwner) {
      // Check if user is a collaborator
      const [collaboration] = await db
        .select()
        .from(collaborators)
        .where(
          and(
            eq(collaborators.noteId, id),
            eq(collaborators.userId, session.user.id)
          )
        );
      
      if (!collaboration) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    
    // Update lastAccessedAt timestamp
    await db
      .update(notes)
      .set({ lastAccessedAt: new Date() })
      .where(eq(notes.id, id));

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { title, content, folderId } = body;
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (folderId !== undefined) updateData.folderId = folderId;

    const [updated] = await db
      .update(notes)
      .set(updateData)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

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

    // Soft delete: set deletedAt timestamp and isTrashed flag
    const [deleted] = await db
      .update(notes)
      .set({
        deletedAt: new Date(),
        isTrashed: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, note: deleted });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}