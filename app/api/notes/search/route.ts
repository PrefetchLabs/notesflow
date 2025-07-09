import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { notes, folders } from '@/lib/db/schema';
import { eq, and, isNull, or, ilike } from 'drizzle-orm';
import { getTableColumns } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ notes: [] });
    }

    // Search notes by title and content
    const searchResults = await db
      .select({
        ...getTableColumns(notes),
        folder: {
          id: folders.id,
          name: folders.name,
        },
      })
      .from(notes)
      .leftJoin(folders, eq(notes.folderId, folders.id))
      .where(
        and(
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt),
          or(
            ilike(notes.title, `%${query}%`),
            ilike(notes.content, `%${query}%`)
          )
        )
      )
      .limit(20);

    return NextResponse.json({ notes: searchResults });
  } catch (error) {
    console.error('Error searching notes:', error);
    return NextResponse.json(
      { error: 'Failed to search notes' },
      { status: 500 }
    );
  }
}