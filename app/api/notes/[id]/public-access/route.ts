import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, collaborators, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function POST(
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

    // Check subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id));

    if (!subscription || subscription.plan === 'free') {
      return NextResponse.json(
        { 
          error: 'Public sharing is only available for Pro users',
          requiresUpgrade: true,
          feature: 'public_sharing'
        },
        { status: 403 }
      );
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
      // Enable public view-only access
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
        // Create public access entry with view-only permission
        await db.insert(collaborators).values({
          noteId,
          userId: PUBLIC_USER_ID,
          permissionLevel: 'view', // Always view-only for public access
          invitedBy: session.user.id,
          invitedAt: new Date(),
          acceptedAt: new Date(), // Auto-accept for public links
        });
      }

      return NextResponse.json({
        success: true,
        enabled: true,
        message: 'Public view-only access enabled',
        publicUrl: `/public/${noteId}`,
      });
    } else {
      // Disable public access
      await db.delete(collaborators).where(
        and(
          eq(collaborators.noteId, noteId),
          eq(collaborators.userId, 'public-access')
        )
      );

      return NextResponse.json({
        success: true,
        enabled: false,
        message: 'Public access disabled',
      });
    }
  } catch (error) {
    // [REMOVED_CONSOLE]
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}