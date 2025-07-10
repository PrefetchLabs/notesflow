import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-server';
import { db } from '@/lib/db';
import { devices, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDevices = await db
      .select()
      .from(devices)
      .where(eq(devices.userId, session.user.id))
      .orderBy(devices.lastActiveAt);

    return NextResponse.json({ devices: userDevices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
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
    const { fingerprint, userAgent, screenResolution, timezone, language, platform } = body;

    // Check if device already exists
    const [existingDevice] = await db
      .select()
      .from(devices)
      .where(
        and(
          eq(devices.userId, session.user.id),
          eq(devices.fingerprint, fingerprint)
        )
      );

    if (existingDevice) {
      // Update last active time
      await db
        .update(devices)
        .set({ lastActiveAt: new Date() })
        .where(eq(devices.id, existingDevice.id));

      return NextResponse.json({ device: existingDevice });
    }

    // Check subscription limits
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id));

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const activeDevices = await db
      .select()
      .from(devices)
      .where(
        and(
          eq(devices.userId, session.user.id),
          eq(devices.isActive, true)
        )
      );

    const deviceLimit = subscription.limits?.maxDevices || 1;
    const isPro = subscription.plan !== 'free';

    if (!isPro && activeDevices.length >= deviceLimit) {
      return NextResponse.json(
        { 
          error: 'Device limit reached',
          limit: deviceLimit,
          current: activeDevices.length,
          requiresUpgrade: true
        },
        { status: 403 }
      );
    }

    // Create new device
    const [newDevice] = await db
      .insert(devices)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        fingerprint,
        userAgent,
        screenResolution,
        timezone,
        language,
        platform,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      })
      .returning();

    // Update device count in subscription usage
    await db
      .update(subscriptions)
      .set({
        usage: {
          ...subscription.usage,
          devicesCount: activeDevices.length + 1,
        },
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    return NextResponse.json({ device: newDevice });
  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('id');

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    // Soft delete the device
    await db
      .update(devices)
      .set({ 
        isActive: false,
        blockedAt: new Date(),
        blockedReason: 'User removed device'
      })
      .where(
        and(
          eq(devices.id, deviceId),
          eq(devices.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing device:', error);
    return NextResponse.json(
      { error: 'Failed to remove device' },
      { status: 500 }
    );
  }
}