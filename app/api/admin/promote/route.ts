import { NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/auth-server';
import { AdminService } from '@/lib/auth/admin-service';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';

export async function POST(request: Request) {
  // Check if requester is authenticated
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if requester is system admin
  const isSystemAdmin = await AdminService.isSystemAdmin(authResult.user.id);
  
  // For initial setup, allow the first user to promote themselves
  // In production, remove this and only allow system admins
  const allAdmins = await AdminService.getAllAdmins();
  const isFirstAdmin = allAdmins.length === 0;

  if (!isSystemAdmin && !isFirstAdmin) {
    return NextResponse.json(
      { error: 'Only system admins can promote users' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, role = 'admin', permissions } = body;

    // If promoting self as first admin, use own ID
    const targetUserId = isFirstAdmin ? authResult.user.id : userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'system_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "system_admin"' },
        { status: 400 }
      );
    }

    // Promote user
    await AdminService.promoteToAdmin(targetUserId, role, permissions);

    return NextResponse.json({
      success: true,
      message: `User ${targetUserId} promoted to ${role}`,
      isFirstAdmin,
    });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to promote user' },
      { status: 500 }
    );
  }
}