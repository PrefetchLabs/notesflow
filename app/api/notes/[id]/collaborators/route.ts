import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, collaborators, user, subscriptions } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { headers } from 'next/headers';

// Get all collaborators for a note
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

    // Check if user has access to the note
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return new NextResponse('Note not found', { status: 404 });
    }

    // Check if user is owner or collaborator
    const hasAccess = note.userId === session.user.id || 
      await db
        .select()
        .from(collaborators)
        .where(and(
          eq(collaborators.noteId, noteId),
          eq(collaborators.userId, session.user.id)
        ))
        .limit(1)
        .then(results => results.length > 0);

    if (!hasAccess) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get all collaborators (excluding public access)
    const allCollaborators = await db
      .select({
        id: collaborators.id,
        userId: collaborators.userId,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
        permissionLevel: collaborators.permissionLevel,
        invitedAt: collaborators.invitedAt,
        acceptedAt: collaborators.acceptedAt,
      })
      .from(collaborators)
      .leftJoin(user, eq(collaborators.userId, user.id))
      .where(and(
        eq(collaborators.noteId, noteId),
        // Exclude public access entries
        ne(collaborators.userId, 'public-access')
      ));

    // Check if public access is enabled
    const [publicAccess] = await db
      .select()
      .from(collaborators)
      .where(and(
        eq(collaborators.noteId, noteId),
        eq(collaborators.userId, 'public-access')
      ))
      .limit(1);

    return NextResponse.json({
      collaborators: allCollaborators,
      publicAccess: !!publicAccess,
      owner: {
        id: note.userId,
        permissionLevel: 'admin' as const,
      },
    });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Invite a new collaborator
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

    // Check if user is admin
    const isAdmin = session.user.role === 'admin' || session.user.role === 'system_admin';
    
    // Check subscription - allow beta and pro users, or admins
    if (!isAdmin) {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id));

      // Allow beta and pro users to share
      const allowedPlans = ['beta', 'pro_monthly', 'pro_yearly'];
      if (!subscription || !allowedPlans.includes(subscription.plan || '')) {
        return NextResponse.json(
          { 
            error: 'Sharing is only available for Beta and Pro users',
            requiresUpgrade: true,
            feature: 'collaboration'
          },
          { status: 403 }
        );
      }
    }

    const { id: noteId } = await params;
    const { email, permission } = await request.json();

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

    // Find user by email
    const [invitedUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!invitedUser) {
      return new NextResponse('User not found. They must be registered on the platform.', { status: 404 });
    }

    // Check if user is already a collaborator
    const [existingCollaborator] = await db
      .select()
      .from(collaborators)
      .where(and(
        eq(collaborators.noteId, noteId),
        eq(collaborators.userId, invitedUser.id)
      ))
      .limit(1);

    if (existingCollaborator) {
      return new NextResponse('User is already a collaborator', { status: 400 });
    }

    // Check if trying to invite the owner
    if (invitedUser.id === note.userId) {
      return new NextResponse('Cannot invite the note owner as a collaborator', { status: 400 });
    }

    // Create collaborator entry
    const [newCollaborator] = await db.insert(collaborators).values({
      noteId,
      userId: invitedUser.id,
      permissionLevel: permission,
      invitedBy: session.user.id,
      invitedAt: new Date(),
    }).returning();

    // TODO: Send email notification to invited user
    // For now, we'll rely on Supabase real-time to notify the user

    return NextResponse.json({
      success: true,
      message: 'User invited successfully',
      collaborator: {
        userId: invitedUser.id,
        userName: invitedUser.name,
        userEmail: invitedUser.email,
        userImage: invitedUser.image,
        permissionLevel: permission,
      },
    });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}