'use client';

import { useQuery } from '@tanstack/react-query';
import { ADMIN_PERMISSIONS, type AdminPermission } from '@/lib/auth/admin-permissions';
import type { UserRole } from '@/types';

interface AdminPermissionsResponse {
  isAdmin: boolean;
  isSystemAdmin: boolean;
  role: UserRole;
  permissions: AdminPermission[];
}

export function useAdminPermissions() {
  const { data, isLoading, error } = useQuery<AdminPermissionsResponse>({
    queryKey: ['admin-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/permissions');
      if (!response.ok) {
        throw new Error('Failed to fetch admin permissions');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if user isn't admin
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    isSystemAdmin: data?.isSystemAdmin ?? false,
    role: data?.role ?? 'user',
    permissions: data?.permissions ?? [],
    isLoading,
    error,
    
    // Helper methods
    hasPermission: (permission: AdminPermission) => 
      data?.permissions?.includes(permission) ?? false,
    
    hasAnyPermission: (permissions: AdminPermission[]) =>
      permissions.some(p => data?.permissions?.includes(p)) ?? false,
    
    hasAllPermissions: (permissions: AdminPermission[]) =>
      permissions.every(p => data?.permissions?.includes(p)) ?? false,
    
    // Common permission checks
    canManageUsers: () => 
      data?.permissions?.includes(ADMIN_PERMISSIONS.USER_VIEW) ?? false,
    
    canModerateContent: () =>
      data?.permissions?.includes(ADMIN_PERMISSIONS.CONTENT_MODERATE) ?? false,
    
    canViewAnalytics: () =>
      data?.permissions?.includes(ADMIN_PERMISSIONS.ANALYTICS_VIEW) ?? false,
    
    canManageSystem: () =>
      data?.permissions?.includes(ADMIN_PERMISSIONS.SYSTEM_CONFIG_UPDATE) ?? false,
  };
}