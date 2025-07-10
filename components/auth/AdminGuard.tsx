'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { type AdminPermission } from '@/lib/auth/admin-permissions';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermissions?: AdminPermission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission is enough
  fallbackUrl?: string;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

export function AdminGuard({
  children,
  requiredPermissions = [],
  requireAll = false,
  fallbackUrl = '/dashboard',
  loadingComponent,
  unauthorizedComponent,
}: AdminGuardProps) {
  const router = useRouter();
  const { 
    isAdmin, 
    isLoading, 
    hasAllPermissions, 
    hasAnyPermission 
  } = useAdminPermissions();

  const hasRequiredPermissions = requiredPermissions.length === 0
    ? isAdmin // If no specific permissions required, just check if admin
    : requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

  useEffect(() => {
    if (!isLoading && !hasRequiredPermissions) {
      router.push(fallbackUrl);
    }
  }, [isLoading, hasRequiredPermissions, router, fallbackUrl]);

  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasRequiredPermissions) {
    return unauthorizedComponent || (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}