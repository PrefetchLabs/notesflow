import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { subscriptions, folders, notes, collaborators } from '@/lib/db/schema';
import { eq, and, isNull, count } from 'drizzle-orm';
import { addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create subscription
    let [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id));

    if (!subscription) {
      // Create default free subscription (no grace period for free users)
      const now = new Date();

      [subscription] = await db
        .insert(subscriptions)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          plan: 'free',
          status: 'active',
          isNewUser: false, // No grace period for free users
          newUserGracePeriodEnd: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
    }

    // Update usage counts
    const [notesCountResult] = await db
      .select({ count: count() })
      .from(notes)
      .where(
        and(
          eq(notes.userId, session.user.id),
          isNull(notes.deletedAt)
        )
      );

    const [foldersCountResult] = await db
      .select({ count: count() })
      .from(folders)
      .where(eq(folders.userId, session.user.id));

    const [collaboratorsCountResult] = await db
      .select({ count: count() })
      .from(collaborators)
      .where(eq(collaborators.userId, session.user.id));

    // Update usage in database
    const updatedUsage = {
      notesCount: notesCountResult?.count || 0,
      foldersCount: foldersCountResult?.count || 0,
      aiCallsCount: subscription.usage?.aiCallsCount || 0, // Keep existing AI calls count
      collaboratorsCount: collaboratorsCountResult?.count || 0,
      storageUsed: subscription.usage?.storageUsed || 0, // Keep existing storage count
    };

    await db
      .update(subscriptions)
      .set({
        usage: updatedUsage,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    return NextResponse.json({
      subscription: {
        ...subscription,
        usage: updatedUsage,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { usage: usageUpdate } = body;

    if (!usageUpdate) {
      return NextResponse.json({ error: 'No usage update provided' }, { status: 400 });
    }

    // Get current subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id));

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Merge usage updates
    const updatedUsage = {
      ...subscription.usage,
      ...usageUpdate,
    };

    // Update subscription
    const [updated] = await db
      .update(subscriptions)
      .set({
        usage: updatedUsage,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    return NextResponse.json({ subscription: updated });
  } catch (error) {
    console.error('Error updating subscription usage:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription usage' },
      { status: 500 }
    );
  }
}