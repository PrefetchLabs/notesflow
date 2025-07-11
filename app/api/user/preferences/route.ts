import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (preferences.length === 0) {
      // Create default preferences
      const newPreferences = await db
        .insert(userPreferences)
        .values({
          userId: user.id,
        })
        .returning();
      
      return NextResponse.json({ preferences: newPreferences[0] });
    }

    return NextResponse.json({ preferences: preferences[0] });
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Check if preferences exist
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    let preferences;
    if (existing.length === 0) {
      // Create with updates
      preferences = await db
        .insert(userPreferences)
        .values({
          userId: user.id,
          ...updates,
          updatedAt: new Date(),
        })
        .returning();
    } else {
      // Update existing
      preferences = await db
        .update(userPreferences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, user.id))
        .returning();
    }

    return NextResponse.json({ preferences: preferences[0] });
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}