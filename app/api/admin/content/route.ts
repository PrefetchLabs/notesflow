import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/auth-server';
import { AdminService } from '@/lib/auth/admin-service';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema/notes';
import { folders } from '@/lib/db/schema/folders';
import { user } from '@/lib/db/schema/auth';
import { desc, ilike, or, and, eq, sql, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check admin permissions
  const hasPermission = await AdminService.checkPermission(
    authResult.user.id,
    ADMIN_PERMISSIONS.CONTENT_VIEW_ALL
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // all, notes, folders
    const userId = searchParams.get('userId');
    const flagged = searchParams.get('flagged') === 'true';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build conditions for notes
    const noteConditions = [];
    if (search) {
      noteConditions.push(
        or(
          ilike(notes.title, `%${search}%`),
          sql`${notes.content}::text ILIKE ${`%${search}%`}`
        )
      );
    }
    if (userId) {
      noteConditions.push(eq(notes.userId, userId));
    }
    if (dateFrom) {
      noteConditions.push(gte(notes.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      noteConditions.push(lte(notes.createdAt, new Date(dateTo)));
    }

    const noteWhereClause = noteConditions.length > 0 ? and(...noteConditions) : undefined;

    // Get content based on type
    let content: any[] = [];
    let totalCount = 0;

    if (type === 'all' || type === 'notes') {
      // Get notes with user info
      const notesQuery = db
        .select({
          id: notes.id,
          type: sql<string>`'note'`,
          title: notes.title,
          content: notes.content,
          userId: notes.userId,
          userName: user.name,
          userEmail: user.email,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
          flagged: sql<boolean>`false`, // TODO: Add flagging system
        })
        .from(notes)
        .leftJoin(user, eq(notes.userId, user.id))
        .where(noteWhereClause)
        .orderBy(desc(notes.updatedAt));

      if (type === 'notes') {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(notes)
          .where(noteWhereClause);
        
        totalCount = Number(countResult[0]?.count || 0);
        
        content = await notesQuery
          .limit(limit)
          .offset((page - 1) * limit);
      } else {
        content = await notesQuery;
      }
    }

    if (type === 'all' || type === 'folders') {
      // Get folders with user info
      const folderConditions = [];
      if (search) {
        folderConditions.push(ilike(folders.name, `%${search}%`));
      }
      if (userId) {
        folderConditions.push(eq(folders.userId, userId));
      }
      if (dateFrom) {
        folderConditions.push(gte(folders.createdAt, new Date(dateFrom)));
      }
      if (dateTo) {
        folderConditions.push(lte(folders.createdAt, new Date(dateTo)));
      }

      const folderWhereClause = folderConditions.length > 0 ? and(...folderConditions) : undefined;

      const foldersQuery = db
        .select({
          id: folders.id,
          type: sql<string>`'folder'`,
          title: folders.name,
          content: sql<any>`null`,
          userId: folders.userId,
          userName: user.name,
          userEmail: user.email,
          createdAt: folders.createdAt,
          updatedAt: folders.updatedAt,
          flagged: sql<boolean>`false`,
        })
        .from(folders)
        .leftJoin(user, eq(folders.userId, user.id))
        .where(folderWhereClause)
        .orderBy(desc(folders.updatedAt));

      if (type === 'folders') {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(folders)
          .where(folderWhereClause);
        
        totalCount = Number(countResult[0]?.count || 0);
        
        content = await foldersQuery
          .limit(limit)
          .offset((page - 1) * limit);
      } else {
        const folderContent = await foldersQuery;
        content = [...content, ...folderContent];
      }
    }

    // If showing all content types, handle pagination manually
    if (type === 'all') {
      totalCount = content.length;
      content = content
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice((page - 1) * limit, page * limit);
    }

    // Filter by flagged status if needed
    if (flagged) {
      content = content.filter(item => item.flagged);
      totalCount = content.length;
    }

    return NextResponse.json({
      content,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// Delete content endpoint
export async function DELETE(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const hasPermission = await AdminService.checkPermission(
    authResult.user.id,
    ADMIN_PERMISSIONS.CONTENT_DELETE_ANY
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { contentId, contentType } = body;

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'Content ID and type required' },
        { status: 400 }
      );
    }

    // Delete based on content type
    if (contentType === 'note') {
      await db.delete(notes).where(eq(notes.id, contentId));
    } else if (contentType === 'folder') {
      await db.delete(folders).where(eq(folders.id, contentId));
    } else {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}