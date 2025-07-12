import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, collaborators } from '@/lib/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { withTimeout, QUERY_TIMEOUTS } from '@/lib/db/query-timeout';

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
    const [note] = await withTimeout(
      db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.id, id),
            isNull(notes.deletedAt)
          )
        ),
      QUERY_TIMEOUTS.SHORT
    );

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user has access (owner or collaborator)
    const isOwner = note.userId === session.user.id;
    
    if (!isOwner) {
      // Check if user is a collaborator
      const [collaboration] = await withTimeout(
        db
          .select()
          .from(collaborators)
          .where(
            and(
              eq(collaborators.noteId, id),
              eq(collaborators.userId, session.user.id)
            )
          ),
        QUERY_TIMEOUTS.SHORT
      );
      
      if (!collaboration) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    
    // Update lastAccessedAt timestamp
    await withTimeout(
      db
        .update(notes)
        .set({ lastAccessedAt: new Date() })
        .where(eq(notes.id, id)),
      QUERY_TIMEOUTS.SHORT
    );

    return NextResponse.json({ note });
  } catch (error) {
    // [REMOVED_CONSOLE]
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
    
    // First check if the note exists and if user has permission
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

    // Check if user is owner
    const isOwner = note.userId === session.user.id;
    let hasEditPermission = isOwner;

    // If not owner, check if user is a collaborator with edit permission
    if (!isOwner) {
      const [collaboration] = await db
        .select()
        .from(collaborators)
        .where(
          and(
            eq(collaborators.noteId, id),
            eq(collaborators.userId, session.user.id),
            or(
              eq(collaborators.permissionLevel, 'edit'),
              eq(collaborators.permissionLevel, 'admin')
            )
          )
        );
      
      hasEditPermission = !!collaboration;
    }

    if (!hasEditPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
      lastEditedBy: session.user.id,
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
          isNull(notes.deletedAt)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    return NextResponse.json({ note: updated });
  } catch (error) {
    // [REMOVED_CONSOLE]
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
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}