import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './config';
import { AdminService } from './admin-service';
import type { AdminPermission } from './admin-permissions';

interface AdminAuthResult {
  success: true;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  isSystemAdmin: boolean;
  permissions: AdminPermission[];
}

interface AdminAuthError {
  success: false;
  error: string;
}

type AdminAuthResponse = AdminAuthResult | AdminAuthError;

/**
 * Server-side admin authentication helper for use in Server Components
 * Automatically redirects unauthorized users
 */
export async function requireAdmin(
  requiredPermissions: AdminPermission[] = [],
  requireAll = false
): Promise<AdminAuthResult> {
  const response = await checkAdminAuth(requiredPermissions, requireAll);
  
  if (!response.success) {
    redirect('/dashboard?error=unauthorized');
  }
  
  return response;
}

/**
 * Server-side admin authentication check without automatic redirect
 * Use this when you want to handle unauthorized access manually
 */
export async function checkAdminAuth(
  requiredPermissions: AdminPermission[] = [],
  requireAll = false
): Promise<AdminAuthResponse> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return {
        success: false,
        error: 'No active session',
      };
    }

    // Check if user is admin
    const isAdmin = await AdminService.isAdmin(session.user.id);
    
    if (!isAdmin) {
      return {
        success: false,
        error: 'User is not an admin',
      };
    }

    // Get user permissions
    const [isSystemAdmin, permissions] = await Promise.all([
      AdminService.isSystemAdmin(session.user.id),
      AdminService.getUserPermissions(session.user.id),
    ]);

    // Check specific permissions if required
    if (requiredPermissions.length > 0) {
      const hasPermission = requireAll
        ? requiredPermissions.every(p => permissions.includes(p))
        : requiredPermissions.some(p => permissions.includes(p));

      if (!hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions',
        };
      }
    }

    // Record admin activity
    await AdminService.recordAdminActivity(session.user.id);

    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
      isSystemAdmin,
      permissions,
    };
  } catch (error) {
    // [REMOVED_CONSOLE]
    return {
      success: false,
      error: 'Authentication error',
    };
  }
}

/**
 * Server-side helper to get admin status without throwing
 * Useful for conditional rendering in Server Components
 */
export async function getAdminStatus(): Promise<{
  isAdmin: boolean;
  isSystemAdmin: boolean;
  permissions: AdminPermission[];
}> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return {
        isAdmin: false,
        isSystemAdmin: false,
        permissions: [],
      };
    }

    const [isAdmin, isSystemAdmin, permissions] = await Promise.all([
      AdminService.isAdmin(session.user.id),
      AdminService.isSystemAdmin(session.user.id),
      AdminService.getUserPermissions(session.user.id),
    ]);

    return {
      isAdmin,
      isSystemAdmin,
      permissions,
    };
  } catch (error) {
    // [REMOVED_CONSOLE]
    return {
      isAdmin: false,
      isSystemAdmin: false,
      permissions: [],
    };
  }
}