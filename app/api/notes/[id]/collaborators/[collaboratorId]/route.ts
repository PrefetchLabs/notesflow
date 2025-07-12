import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, collaborators } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

// Update collaborator permission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: noteId, collaboratorId } = await params;
    const { permission } = await request.json();

    // Validate permission level
    if (!['view', 'edit'].includes(permission)) {
      return new NextResponse('Invalid permission level', { status: 400 });
    }

    // Check if user owns the note or is an admin collaborator
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return new NextResponse('Note not found', { status: 404 });
    }

    const isOwner = note.userId === session.user.id;
    const [adminAccess] = await db
      .select()
      .from(collaborators)
      .where(and(
        eq(collaborators.noteId, noteId),
        eq(collaborators.userId, session.user.id),
        eq(collaborators.permissionLevel, 'admin')
      ))
      .limit(1);

    if (!isOwner && !adminAccess) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Update the collaborator's permission
    await db
      .update(collaborators)
      .set({ permissionLevel: permission })
      .where(and(
        eq(collaborators.id, collaboratorId),
        eq(collaborators.noteId, noteId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Remove a collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: noteId, collaboratorId } = await params;

    // Check if user owns the note or is an admin collaborator
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return new NextResponse('Note not found', { status: 404 });
    }

    const isOwner = note.userId === session.user.id;
    const [adminAccess] = await db
      .select()
      .from(collaborators)
      .where(and(
        eq(collaborators.noteId, noteId),
        eq(collaborators.userId, session.user.id),
        eq(collaborators.permissionLevel, 'admin')
      ))
      .limit(1);

    if (!isOwner && !adminAccess) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete the collaborator
    await db
      .delete(collaborators)
      .where(and(
        eq(collaborators.id, collaboratorId),
        eq(collaborators.noteId, noteId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}