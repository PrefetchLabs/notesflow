import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { folders } from '@/lib/db/schema';
import { eq, and, desc, asc, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all folders for the user
    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, session.user.id))
      .orderBy(asc(folders.position), asc(folders.name));

    // Build a tree structure
    const folderMap = new Map();
    const rootFolders = [];

    // First pass: create all folder objects
    userFolders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
      });
    });

    // Second pass: build the tree
    userFolders.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderMap.get(folder.id));
        }
      } else {
        rootFolders.push(folderMap.get(folder.id));
      }
    });

    return NextResponse.json({ folders: rootFolders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
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
    const { name, parentId, color, icon } = body;

    // Get the highest position in the parent folder
    const maxPositionResult = await db
      .select({ maxPosition: folders.position })
      .from(folders)
      .where(
        and(
          eq(folders.userId, session.user.id),
          parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId)
        )
      )
      .orderBy(desc(folders.position))
      .limit(1);

    const position = maxPositionResult[0]?.maxPosition ?? -1;

    // Create the path based on parent
    let path = '/';
    if (parentId) {
      const [parent] = await db
        .select({ path: folders.path })
        .from(folders)
        .where(
          and(
            eq(folders.id, parentId),
            eq(folders.userId, session.user.id)
          )
        );
      if (parent) {
        path = `${parent.path}${parentId}/`;
      }
    }

    const [newFolder] = await db
      .insert(folders)
      .values({
        name,
        userId: session.user.id,
        parentId: parentId || null,
        color: color || '#6B7280',
        icon: icon || 'folder',
        position: position + 1,
        path,
      })
      .returning();

    return NextResponse.json({ folder: newFolder });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}