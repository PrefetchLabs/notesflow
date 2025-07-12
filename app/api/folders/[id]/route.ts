import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { folders, notes } from '@/lib/db/schema';
import { eq, and, like, inArray } from 'drizzle-orm';

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
    const { name, parentId, position, color, icon } = body;

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (position !== undefined) updateData.position = position;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    // If parentId changed, update the path
    if (parentId !== undefined) {
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
      updateData.path = path;
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(folders)
      .set(updateData)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, session.user.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // If path changed, update all descendant folders
    if (updateData.path) {
      const oldPath = await db
        .select({ path: folders.path })
        .from(folders)
        .where(eq(folders.id, id));

      if (oldPath[0]) {
        await db
          .update(folders)
          .set({
            path: like(folders.path, `${oldPath[0].path}${id}/%`),
          })
          .where(
            and(
              like(folders.path, `${oldPath[0].path}${id}/%`),
              eq(folders.userId, session.user.id)
            )
          );
      }
    }

    return NextResponse.json({ folder: updated });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to update folder' },
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

    // Get the folder to ensure it exists and belongs to user
    const [folder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, session.user.id)
        )
      );

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Find all descendant folders (not including the folder itself)
    // We need to be careful with the path matching to avoid matching all folders
    const descendantFolders = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.userId, session.user.id),
          like(folders.path, `${folder.path}${id}/%`)
        )
      );

    const folderIds = [id, ...descendantFolders.map(f => f.id)];
    
    // Safety check: log what we're about to delete
    // [REMOVED_CONSOLE]
    // [REMOVED_CONSOLE]

    // Delete all notes in this folder and all descendant folders
    if (folderIds.length > 0) {
      await db
        .delete(notes)
        .where(
          and(
            eq(notes.userId, session.user.id),
            inArray(notes.folderId, folderIds)
          )
        );
    }

    // Delete all descendant folders and the folder itself
    if (folderIds.length > 0) {
      await db
        .delete(folders)
        .where(
          and(
            eq(folders.userId, session.user.id),
            inArray(folders.id, folderIds)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}