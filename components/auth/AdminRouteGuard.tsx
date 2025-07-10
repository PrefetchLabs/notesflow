'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { ADMIN_PERMISSIONS, type AdminPermission } from '@/lib/auth/admin-permissions';
import { Loader2 } from 'lucide-react';

interface RouteConfig {
  path: string;
  permissions?: AdminPermission[];
  requireAll?: boolean;
}

const adminRouteConfig: RouteConfig[] = [
  { path: '/dashboard/admin/users', permissions: [ADMIN_PERMISSIONS.USER_VIEW] },
  { path: '/dashboard/admin/content', permissions: [ADMIN_PERMISSIONS.CONTENT_VIEW_ALL] },
  { path: '/dashboard/admin/analytics', permissions: [ADMIN_PERMISSIONS.ANALYTICS_VIEW] },
  { path: '/dashboard/admin/system', permissions: [ADMIN_PERMISSIONS.SYSTEM_CONFIG_VIEW] },
];

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side route guard for admin pages
 * Works in conjunction with middleware for double protection
 */
export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const { 
    isAdmin, 
    isLoading, 
    hasAllPermissions, 
    hasAnyPermission,
    permissions 
  } = useAdminPermissions();

  useEffect(() => {
    if (!isLoading) {
      // Find matching route config
      const routeConfig = adminRouteConfig.find(config => 
        pathname.startsWith(config.path)
      );

      let hasAccess = isAdmin;

      // Check specific permissions if required
      if (hasAccess && routeConfig?.permissions && routeConfig.permissions.length > 0) {
        hasAccess = routeConfig.requireAll
          ? hasAllPermissions(routeConfig.permissions)
          : hasAnyPermission(routeConfig.permissions);
      }

      if (!hasAccess) {
        // Redirect to dashboard with error
        router.push('/dashboard?error=unauthorized');
      } else {
        setIsChecking(false);
      }
    }
  }, [isLoading, isAdmin, pathname, router, hasAllPermissions, hasAnyPermission]);

  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}