import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { folders, notes } from '@/lib/db/schema';
import { eq, and, like } from 'drizzle-orm';

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
    console.error('Error updating folder:', error);
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

    // Check if folder has notes
    const noteCount = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.folderId, id),
          eq(notes.userId, session.user.id)
        )
      );

    if (noteCount && noteCount.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder with notes' },
        { status: 400 }
      );
    }

    // Delete the folder (cascades to child folders)
    const [deleted] = await db
      .delete(folders)
      .where(
        and(
          eq(folders.id, id),
          eq(folders.userId, session.user.id)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}