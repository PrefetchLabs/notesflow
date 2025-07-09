import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, folders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getTableColumns } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notesList = await db
      .select({
        ...getTableColumns(notes),
        folder: {
          id: folders.id,
          name: folders.name,
        },
      })
      .from(notes)
      .leftJoin(folders, eq(notes.folderId, folders.id))
      .where(eq(notes.userId, session.user.id))
      .orderBy(desc(notes.updatedAt));

    return NextResponse.json({ notes: notesList });
  } catch (error) {
    console.error('Error fetching notes:', error);
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

    const [newNote] = await db
      .insert(notes)
      .values({
        title,
        content: validContent,
        userId: session.user.id,
        folderId: folderId || null,
      })
      .returning();

    return NextResponse.json({ note: newNote });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}