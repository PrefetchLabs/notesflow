'use client';

import React, { createContext, useContext } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import type { AdminPermission } from '@/lib/auth/admin-permissions';
import type { UserRole } from '@/types';

interface AdminContextValue {
  isAdmin: boolean;
  isSystemAdmin: boolean;
  role: UserRole;
  permissions: AdminPermission[];
  isLoading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  hasAnyPermission: (permissions: AdminPermission[]) => boolean;
  hasAllPermissions: (permissions: AdminPermission[]) => boolean;
  canManageUsers: () => boolean;
  canModerateContent: () => boolean;
  canViewAnalytics: () => boolean;
  canManageSystem: () => boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const adminPermissions = useAdminPermissions();

  return (
    <AdminContext.Provider value={adminPermissions}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}