import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth-server';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user as userTable } from '@/lib/db/schema/auth';

// Check if user is admin and has specific permissions (server-side)
export async function checkAdminPermission(permissions?: string[]): Promise<{
  isAuthorized: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { isAuthorized: false, error: 'Unauthorized' };
    }

    const [dbUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'system_admin')) {
      return { isAuthorized: false, error: 'Forbidden - Admin access required' };
    }

    // If specific permissions are required, check them
    if (permissions && permissions.length > 0) {
      const userPermissions = (dbUser.adminPermissions as string[]) || [];
      const hasAllPermissions = permissions.every(p => userPermissions.includes(p));
      
      if (!hasAllPermissions) {
        return { isAuthorized: false, error: 'Insufficient permissions' };
      }
    }

    return { isAuthorized: true, user: dbUser };
  } catch (error) {
    // [REMOVED_CONSOLE]
    return { isAuthorized: false, error: 'Internal server error' };
  }
}

// Require system admin access (throws error if not authorized)
export async function requireSystemAdmin() {
  const result = await checkAdminPermission();
  
  if (!result.isAuthorized) {
    return { 
      error: result.error || 'Unauthorized', 
      status: result.error === 'Unauthorized' ? 401 : 403 
    };
  }
  
  return { user: result.user };
}