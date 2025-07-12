import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, collaborators, user, subscriptions } from '@/lib/db/schema';
import { eq, and, isNull, or, ne, count } from 'drizzle-orm';
import { withTimeout, QUERY_TIMEOUTS } from '@/lib/db/query-timeout';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notes owned by the user
    const ownedNotes = await withTimeout(
      db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.userId, session.user.id),
            isNull(notes.deletedAt)
          )
        ),
      QUERY_TIMEOUTS.DEFAULT
    );

    // Get notes shared with the user
    const sharedCollaborations = await withTimeout(
      db
        .select({
          noteId: collaborators.noteId,
          permissionLevel: collaborators.permissionLevel,
        })
        .from(collaborators)
        .where(
          and(
            eq(collaborators.userId, session.user.id),
            ne(collaborators.noteId, 'public-access') // This ensures we don't get public-only shares
          )
        ),
      QUERY_TIMEOUTS.DEFAULT
    );

    // Get details of shared notes if any
    let sharedNotesData: any[] = [];
    if (sharedCollaborations.length > 0) {
      const sharedNoteIds = sharedCollaborations.map(c => c.noteId);
      
      // Fetch the shared notes with owner info
      const sharedNotesQuery = await withTimeout(
        db
          .select({
            note: notes,
            ownerName: user.name,
            ownerEmail: user.email,
          })
          .from(notes)
          .leftJoin(user, eq(notes.userId, user.id))
          .where(
            and(
              or(...sharedNoteIds.map(id => eq(notes.id, id))),
              isNull(notes.deletedAt)
            )
          ),
        QUERY_TIMEOUTS.DEFAULT
      );

      // Map the shared notes with permission info
      sharedNotesData = sharedNotesQuery.map(({ note, ownerName, ownerEmail }) => {
        const collaboration = sharedCollaborations.find(c => c.noteId === note.id);
        return {
          id: note.id,
          title: note.title,
          content: note.content,
          folderId: note.folderId,
          tags: note.tags,
          isPinned: note.isPinned,
          isArchived: note.isArchived,
          isTrashed: note.isTrashed,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          folder: null,
          isShared: true,
          permissionLevel: collaboration?.permissionLevel || 'view',
          owner: {
            id: note.userId,
            name: ownerName,
            email: ownerEmail,
          },
        };
      });
    }

    // Format owned notes
    const formattedOwnedNotes = ownedNotes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      folderId: note.folderId,
      tags: note.tags,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      isTrashed: note.isTrashed,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      folder: null,
      isShared: false,
      permissionLevel: 'admin' as const,
      owner: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    }));

    // Combine and sort all notes
    const allNotes = [...formattedOwnedNotes, ...sharedNotesData].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ notes: allNotes });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription limits
    const [subscription] = await withTimeout(
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id)),
      QUERY_TIMEOUTS.SHORT
    );

    if (subscription && subscription.plan === 'free') {
      // Count existing notes
      const [notesCount] = await withTimeout(
        db
          .select({ count: count() })
          .from(notes)
          .where(
            and(
              eq(notes.userId, session.user.id),
              isNull(notes.deletedAt)
            )
          ),
        QUERY_TIMEOUTS.SHORT
      );

      const noteLimit = subscription.limits?.maxNotes || 10;
      const currentCount = notesCount?.count || 0;

      if (currentCount >= noteLimit) {
        return NextResponse.json(
          { 
            error: `Note limit reached. Free plan allows ${noteLimit} notes.`,
            limit: noteLimit,
            current: currentCount,
            requiresUpgrade: true
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { title = 'Untitled Note', content, folderId } = body;
    
    // Ensure content is never empty for BlockNote
    const validContent = content && Array.isArray(content) && content.length > 0
      ? content
      : [{
          type: 'paragraph',
          props: {
            textColor: 'default',
            backgroundColor: 'default',
          },
          content: [],
          children: [],
        }];

    const [newNote] = await withTimeout(
      db
        .insert(notes)
        .values({
          title,
          content: validContent,
          userId: session.user.id,
          folderId: folderId || null,
        })
        .returning(),
      QUERY_TIMEOUTS.DEFAULT
    );

    return NextResponse.json({ note: newNote });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}