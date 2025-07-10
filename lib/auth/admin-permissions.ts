// Admin permission definitions
export const ADMIN_PERMISSIONS = {
  // User management permissions
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_SUSPEND: 'user:suspend',
  USER_PROMOTE: 'user:promote',
  
  // Content management permissions
  CONTENT_VIEW_ALL: 'content:view_all',
  CONTENT_MODERATE: 'content:moderate',
  CONTENT_DELETE_ANY: 'content:delete_any',
  
  // System configuration permissions
  SYSTEM_CONFIG_VIEW: 'system:config_view',
  SYSTEM_CONFIG_UPDATE: 'system:config_update',
  
  // Analytics and monitoring permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Subscription management permissions
  SUBSCRIPTION_VIEW: 'subscription:view',
  SUBSCRIPTION_MODIFY: 'subscription:modify',
  SUBSCRIPTION_GRANT: 'subscription:grant',
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];

// Default permissions for different admin levels
export const DEFAULT_ADMIN_PERMISSIONS: Record<'admin' | 'system_admin', AdminPermission[]> = {
  admin: [
    ADMIN_PERMISSIONS.USER_VIEW,
    ADMIN_PERMISSIONS.USER_UPDATE,
    ADMIN_PERMISSIONS.USER_SUSPEND,
    ADMIN_PERMISSIONS.CONTENT_VIEW_ALL,
    ADMIN_PERMISSIONS.CONTENT_MODERATE,
    ADMIN_PERMISSIONS.ANALYTICS_VIEW,
    ADMIN_PERMISSIONS.SUBSCRIPTION_VIEW,
  ],
  system_admin: Object.values(ADMIN_PERMISSIONS), // All permissions
};

// Helper function to check if a user has a specific permission
export function hasAdminPermission(
  userPermissions: string[],
  requiredPermission: AdminPermission
): boolean {
  return userPermissions.includes(requiredPermission);
}

// Helper function to check if a user has any of the required permissions
export function hasAnyAdminPermission(
  userPermissions: string[],
  requiredPermissions: AdminPermission[]
): boolean {
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}

// Helper function to check if a user has all of the required permissions
export function hasAllAdminPermissions(
  userPermissions: string[],
  requiredPermissions: AdminPermission[]
): boolean {
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}