import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, collaborators } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: noteId } = await params;
    const { enable } = await request.json();

    // Check if user owns the note
    const [note] = await db
      .select()
      .from(notes)
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, session.user.id)
      ))
      .limit(1);

    if (!note) {
      return new NextResponse('Note not found or unauthorized', { status: 404 });
    }

    if (enable) {
      // Enable sharing by creating a public collaborator entry
      // We use a special user ID to represent public access
      const PUBLIC_USER_ID = 'public-access';
      
      // Check if public access already exists
      const [existingPublicAccess] = await db
        .select()
        .from(collaborators)
        .where(and(
          eq(collaborators.noteId, noteId),
          eq(collaborators.userId, PUBLIC_USER_ID)
        ))
        .limit(1);

      if (!existingPublicAccess) {
        // Create public access entry
        await db.insert(collaborators).values({
          noteId,
          userId: PUBLIC_USER_ID,
          permissionLevel: 'edit',
          invitedBy: session.user.id,
          invitedAt: new Date(),
          acceptedAt: new Date(), // Auto-accept for public links
        });
      }

      // Update the note to mark it as shared (this will trigger real-time updates)
      await db.update(notes)
        .set({ updatedAt: new Date() })
        .where(eq(notes.id, noteId));

      return NextResponse.json({
        success: true,
        message: 'Sharing enabled',
        shareUrl: `/shared/${noteId}`,
      });
    } else {
      // Disable sharing by removing public access
      await db.delete(collaborators).where(
        and(
          eq(collaborators.noteId, noteId),
          eq(collaborators.userId, 'public-access')
        )
      );

      return NextResponse.json({
        success: true,
        message: 'Sharing disabled',
      });
    }
  } catch (error) {
    // [REMOVED_CONSOLE]
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Get sharing status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: noteId } = await params;

    // Check if public access exists
    const [publicAccess] = await db
      .select()
      .from(collaborators)
      .where(and(
        eq(collaborators.noteId, noteId),
        eq(collaborators.userId, 'public-access')
      ))
      .limit(1);

    // Get all collaborators
    const allCollaborators = await db
      .select()
      .from(collaborators)
      .where(eq(collaborators.noteId, noteId));

    return NextResponse.json({
      isShared: !!publicAccess,
      shareUrl: publicAccess ? `/shared/${noteId}` : null,
      collaboratorCount: allCollaborators.length,
    });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}