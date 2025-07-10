import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';
import { eq } from 'drizzle-orm';
import { 
  ADMIN_PERMISSIONS, 
  DEFAULT_ADMIN_PERMISSIONS, 
  hasAdminPermission, 
  hasAnyAdminPermission,
  hasAllAdminPermissions,
  type AdminPermission 
} from './admin-permissions';
import type { User, UserRole } from '@/types';

export class AdminService {
  // Check if a user has system admin access
  static async isSystemAdmin(userId: string): Promise<boolean> {
    const result = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    const userData = result[0];
    return userData?.role === 'system_admin';
  }

  // Check if a user has any admin access
  static async isAdmin(userId: string): Promise<boolean> {
    const result = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    const userData = result[0];
    return userData?.role === 'admin' || userData?.role === 'system_admin';
  }

  // Get user's admin permissions
  static async getUserPermissions(userId: string): Promise<AdminPermission[]> {
    const result = await db
      .select({
        role: user.role,
        adminPermissions: user.adminPermissions
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    const userData = result[0];
    if (!userData) return [];

    // System admins have all permissions
    if (userData.role === 'system_admin') {
      return Object.values(ADMIN_PERMISSIONS);
    }

    // Regular admins have their specific permissions or defaults
    if (userData.role === 'admin') {
      const customPermissions = userData.adminPermissions as string[] || [];
      return customPermissions.length > 0 
        ? customPermissions as AdminPermission[]
        : DEFAULT_ADMIN_PERMISSIONS.admin;
    }

    return [];
  }

  // Check if user has a specific permission
  static async checkPermission(
    userId: string, 
    permission: AdminPermission
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return hasAdminPermission(permissions, permission);
  }

  // Check if user has any of the required permissions
  static async checkAnyPermission(
    userId: string, 
    permissions: AdminPermission[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return hasAnyAdminPermission(userPermissions, permissions);
  }

  // Check if user has all of the required permissions
  static async checkAllPermissions(
    userId: string, 
    permissions: AdminPermission[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return hasAllAdminPermissions(userPermissions, permissions);
  }

  // Promote user to admin
  static async promoteToAdmin(
    userId: string, 
    role: Exclude<UserRole, 'user'> = 'admin',
    permissions?: AdminPermission[]
  ): Promise<void> {
    const updateData: any = {
      role,
      adminPermissions: permissions || DEFAULT_ADMIN_PERMISSIONS[role]
    };

    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId));
  }

  // Demote admin to regular user
  static async demoteToUser(userId: string): Promise<void> {
    await db
      .update(user)
      .set({
        role: 'user',
        adminPermissions: [],
        lastAdminActivityAt: null
      })
      .where(eq(user.id, userId));
  }

  // Update admin permissions
  static async updatePermissions(
    userId: string, 
    permissions: AdminPermission[]
  ): Promise<void> {
    await db
      .update(user)
      .set({
        adminPermissions: permissions
      })
      .where(eq(user.id, userId));
  }

  // Record admin activity
  static async recordAdminActivity(userId: string): Promise<void> {
    await db
      .update(user)
      .set({
        lastAdminActivityAt: new Date()
      })
      .where(eq(user.id, userId));
  }

  // Get all admin users
  static async getAllAdmins(): Promise<Array<{
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    adminPermissions: string[];
    lastAdminActivityAt: Date | null;
  }>> {
    const admins = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        adminPermissions: user.adminPermissions,
        lastAdminActivityAt: user.lastAdminActivityAt
      })
      .from(user)
      .where(eq(user.role, 'admin'));
    
    return admins;
  }
}