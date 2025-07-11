import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/auth-server';
import { AdminService } from '@/lib/auth/admin-service';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
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
    ADMIN_PERMISSIONS.USER_UPDATE
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, isActive, reason } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Prevent self-disable
    if (userId === authResult.user.id && !isActive) {
      return NextResponse.json(
        { error: 'Cannot disable your own account' },
        { status: 400 }
      );
    }

    // Get current user data
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent disabling system admins unless you are one
    if (targetUser.role === 'system_admin' && authResult.user.role !== 'system_admin') {
      return NextResponse.json(
        { error: 'Cannot disable system administrators' },
        { status: 403 }
      );
    }

    // Update user status
    const updates = {
      isActive,
      updatedAt: new Date(),
      ...(isActive
        ? {
            disabledAt: null,
            disabledReason: null,
          }
        : {
            disabledAt: new Date(),
            disabledReason: reason || 'Disabled by administrator',
          }),
    };

    await db
      .update(user)
      .set(updates)
      .where(eq(user.id, userId));

    return NextResponse.json({ 
      success: true, 
      message: isActive ? 'Account enabled' : 'Account disabled' 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}