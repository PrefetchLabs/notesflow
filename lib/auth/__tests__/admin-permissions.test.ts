import { describe, it, expect } from 'vitest';
import {
  ADMIN_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  hasAdminPermission,
  hasAnyAdminPermission,
  hasAllAdminPermissions,
} from '../admin-permissions';

describe('Admin Permissions', () => {
  describe('Permission Constants', () => {
    it('should have all expected permission keys', () => {
      const expectedKeys = [
        'USER_VIEW',
        'USER_CREATE',
        'USER_UPDATE',
        'USER_DELETE',
        'USER_SUSPEND',
        'USER_PROMOTE',
        'CONTENT_VIEW_ALL',
        'CONTENT_MODERATE',
        'CONTENT_DELETE_ANY',
        'SYSTEM_CONFIG_VIEW',
        'SYSTEM_CONFIG_UPDATE',
        'ANALYTICS_VIEW',
        'ANALYTICS_EXPORT',
        'SUBSCRIPTION_VIEW',
        'SUBSCRIPTION_MODIFY',
        'SUBSCRIPTION_GRANT',
      ];

      expect(Object.keys(ADMIN_PERMISSIONS)).toEqual(expectedKeys);
    });

    it('should have unique permission values', () => {
      const values = Object.values(ADMIN_PERMISSIONS);
      const uniqueValues = [...new Set(values)];
      expect(values.length).toBe(uniqueValues.length);
    });
  });

  describe('Default Permissions', () => {
    it('should assign correct permissions to admin role', () => {
      const adminPerms = DEFAULT_ADMIN_PERMISSIONS.admin;
      
      // Admin should have these permissions
      expect(adminPerms).toContain(ADMIN_PERMISSIONS.USER_VIEW);
      expect(adminPerms).toContain(ADMIN_PERMISSIONS.USER_UPDATE);
      expect(adminPerms).toContain(ADMIN_PERMISSIONS.USER_SUSPEND);
      expect(adminPerms).toContain(ADMIN_PERMISSIONS.CONTENT_VIEW_ALL);
      expect(adminPerms).toContain(ADMIN_PERMISSIONS.CONTENT_MODERATE);
      expect(adminPerms).toContain(ADMIN_PERMISSIONS.ANALYTICS_VIEW);
      expect(adminPerms).toContain(ADMIN_PERMISSIONS.SUBSCRIPTION_VIEW);

      // Admin should NOT have these permissions
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.USER_CREATE);
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.USER_DELETE);
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.USER_PROMOTE);
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.CONTENT_DELETE_ANY);
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.SYSTEM_CONFIG_VIEW);
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.SYSTEM_CONFIG_UPDATE);
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.ANALYTICS_EXPORT);
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.SUBSCRIPTION_MODIFY);
      expect(adminPerms).not.toContain(ADMIN_PERMISSIONS.SUBSCRIPTION_GRANT);
    });

    it('should assign all permissions to system_admin role', () => {
      const systemAdminPerms = DEFAULT_ADMIN_PERMISSIONS.system_admin;
      const allPerms = Object.values(ADMIN_PERMISSIONS);
      
      expect(systemAdminPerms).toHaveLength(allPerms.length);
      allPerms.forEach(perm => {
        expect(systemAdminPerms).toContain(perm);
      });
    });
  });

  describe('hasAdminPermission', () => {
    const userPermissions = [
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.USER_UPDATE,
      ADMIN_PERMISSIONS.CONTENT_VIEW_ALL,
    ];

    it('should return true when user has the required permission', () => {
      expect(hasAdminPermission(userPermissions, ADMIN_PERMISSIONS.USER_VIEW)).toBe(true);
      expect(hasAdminPermission(userPermissions, ADMIN_PERMISSIONS.USER_UPDATE)).toBe(true);
      expect(hasAdminPermission(userPermissions, ADMIN_PERMISSIONS.CONTENT_VIEW_ALL)).toBe(true);
    });

    it('should return false when user lacks the required permission', () => {
      expect(hasAdminPermission(userPermissions, ADMIN_PERMISSIONS.USER_DELETE)).toBe(false);
      expect(hasAdminPermission(userPermissions, ADMIN_PERMISSIONS.SYSTEM_CONFIG_UPDATE)).toBe(false);
    });

    it('should handle empty permissions array', () => {
      expect(hasAdminPermission([], ADMIN_PERMISSIONS.USER_VIEW)).toBe(false);
    });
  });

  describe('hasAnyAdminPermission', () => {
    const userPermissions = [
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.USER_UPDATE,
      ADMIN_PERMISSIONS.CONTENT_VIEW_ALL,
    ];

    it('should return true when user has at least one required permission', () => {
      const required = [
        ADMIN_PERMISSIONS.USER_DELETE,
        ADMIN_PERMISSIONS.USER_VIEW, // User has this
        ADMIN_PERMISSIONS.SYSTEM_CONFIG_UPDATE,
      ];
      expect(hasAnyAdminPermission(userPermissions, required)).toBe(true);
    });

    it('should return false when user has none of the required permissions', () => {
      const required = [
        ADMIN_PERMISSIONS.USER_DELETE,
        ADMIN_PERMISSIONS.SYSTEM_CONFIG_UPDATE,
        ADMIN_PERMISSIONS.SUBSCRIPTION_GRANT,
      ];
      expect(hasAnyAdminPermission(userPermissions, required)).toBe(false);
    });

    it('should handle empty arrays', () => {
      expect(hasAnyAdminPermission([], [ADMIN_PERMISSIONS.USER_VIEW])).toBe(false);
      expect(hasAnyAdminPermission(userPermissions, [])).toBe(false);
      expect(hasAnyAdminPermission([], [])).toBe(false);
    });
  });

  describe('hasAllAdminPermissions', () => {
    const userPermissions = [
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.USER_UPDATE,
      ADMIN_PERMISSIONS.CONTENT_VIEW_ALL,
    ];

    it('should return true when user has all required permissions', () => {
      const required = [
        ADMIN_PERMISSIONS.USER_VIEW,
        ADMIN_PERMISSIONS.USER_UPDATE,
      ];
      expect(hasAllAdminPermissions(userPermissions, required)).toBe(true);
    });

    it('should return false when user lacks any required permission', () => {
      const required = [
        ADMIN_PERMISSIONS.USER_VIEW,
        ADMIN_PERMISSIONS.USER_UPDATE,
        ADMIN_PERMISSIONS.USER_DELETE, // User doesn't have this
      ];
      expect(hasAllAdminPermissions(userPermissions, required)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(hasAllAdminPermissions(userPermissions, [])).toBe(true); // No permissions required
      expect(hasAllAdminPermissions([], [ADMIN_PERMISSIONS.USER_VIEW])).toBe(false);
      expect(hasAllAdminPermissions([], [])).toBe(true);
    });
  });

  describe('Permission Hierarchy', () => {
    it('should ensure system_admin has all permissions that admin has', () => {
      const adminPerms = DEFAULT_ADMIN_PERMISSIONS.admin;
      const systemAdminPerms = DEFAULT_ADMIN_PERMISSIONS.system_admin;

      adminPerms.forEach(perm => {
        expect(systemAdminPerms).toContain(perm);
      });
    });

    it('should validate permission naming conventions', () => {
      Object.values(ADMIN_PERMISSIONS).forEach(perm => {
        // All permissions should follow the format: category:action
        expect(perm).toMatch(/^[a-z_]+:[a-z_]+$/);
        
        // Check for valid categories
        const [category] = perm.split(':');
        expect(['user', 'content', 'system', 'analytics', 'subscription']).toContain(category);
      });
    });
  });
});