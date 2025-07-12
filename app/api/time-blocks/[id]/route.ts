import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { timeBlocks } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function PATCH(
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
    const updates: any = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.startTime !== undefined) updates.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) updates.endTime = new Date(body.endTime);
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.isCompleted !== undefined) {
      updates.isCompleted = body.isCompleted;
      if (body.isCompleted) {
        updates.completedAt = new Date();
      } else {
        updates.completedAt = null;
      }
    }

    // Validate times if provided
    if (updates.startTime && updates.endTime) {
      if (updates.startTime >= updates.endTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const [block] = await db
      .update(timeBlocks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(timeBlocks.id, id),
          eq(timeBlocks.userId, session.user.id)
        )
      )
      .returning();

    if (!block) {
      return NextResponse.json({ error: 'Time block not found' }, { status: 404 });
    }

    return NextResponse.json({ block });
  } catch (error) {
    console.error('Error updating time block:', error);
    return NextResponse.json(
      { error: 'Failed to update time block' },
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

    const [deletedBlock] = await db
      .delete(timeBlocks)
      .where(
        and(
          eq(timeBlocks.id, id),
          eq(timeBlocks.userId, session.user.id)
        )
      )
      .returning();

    if (!deletedBlock) {
      return NextResponse.json({ error: 'Time block not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time block:', error);
    return NextResponse.json(
      { error: 'Failed to delete time block' },
      { status: 500 }
    );
  }
}