import { NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/auth-server';
import { AdminService } from '@/lib/auth/admin-service';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';

export async function GET(request: Request) {
  // First check basic auth
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = authResult.user.id;

  // Check admin status
  const isAdmin = await AdminService.isAdmin(userId);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  // Example of checking specific permission
  const canViewUsers = await AdminService.checkPermission(
    userId,
    ADMIN_PERMISSIONS.USER_VIEW
  );

  // Get all admin info
  const [isSystemAdmin, permissions] = await Promise.all([
    AdminService.isSystemAdmin(userId),
    AdminService.getUserPermissions(userId),
  ]);

  return NextResponse.json({
    message: 'Admin access verified',
    user: {
      id: userId,
      email: authResult.user.email,
    },
    adminInfo: {
      isAdmin,
      isSystemAdmin,
      permissions,
      canViewUsers,
    },
  });
}