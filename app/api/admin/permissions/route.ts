import { NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/auth-server';
import { AdminService } from '@/lib/auth/admin-service';

export async function GET(request: Request) {
  const authResult = await authMiddleware(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = authResult.user.id;

  try {
    const [isAdmin, isSystemAdmin, permissions] = await Promise.all([
      AdminService.isAdmin(userId),
      AdminService.isSystemAdmin(userId),
      AdminService.getUserPermissions(userId),
    ]);

    // Get the user's role from the database
    const userRole = isSystemAdmin ? 'system_admin' : 
                     isAdmin ? 'admin' : 'user';

    return NextResponse.json({
      isAdmin,
      isSystemAdmin,
      role: userRole,
      permissions,
    });
  } catch (error) {
    // [REMOVED_CONSOLE]
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}