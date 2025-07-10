import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminService } from '../admin-service';
import { ADMIN_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS } from '../admin-permissions';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema/auth';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    set: vi.fn(),
    limit: vi.fn(),
  },
}));

describe('AdminService', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSystemAdmin', () => {
    it('should return true for system_admin role', async () => {
      const mockResult = [{ role: 'system_admin' }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.isSystemAdmin(mockUserId);
      
      expect(result).toBe(true);
      expect(db.select).toHaveBeenCalledWith({ role: user.role });
    });

    it('should return false for admin role', async () => {
      const mockResult = [{ role: 'admin' }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.isSystemAdmin(mockUserId);
      
      expect(result).toBe(false);
    });

    it('should return false for user role', async () => {
      const mockResult = [{ role: 'user' }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.isSystemAdmin(mockUserId);
      
      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      const mockResult: any[] = [];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.isSystemAdmin(mockUserId);
      
      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', async () => {
      const mockResult = [{ role: 'admin' }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.isAdmin(mockUserId);
      
      expect(result).toBe(true);
    });

    it('should return true for system_admin role', async () => {
      const mockResult = [{ role: 'system_admin' }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.isAdmin(mockUserId);
      
      expect(result).toBe(true);
    });

    it('should return false for user role', async () => {
      const mockResult = [{ role: 'user' }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.isAdmin(mockUserId);
      
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for system_admin', async () => {
      const mockResult = [{ role: 'system_admin', adminPermissions: [] }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.getUserPermissions(mockUserId);
      
      expect(result).toEqual(Object.values(ADMIN_PERMISSIONS));
    });

    it('should return custom permissions for admin with custom permissions', async () => {
      const customPerms = [ADMIN_PERMISSIONS.USER_VIEW, ADMIN_PERMISSIONS.USER_UPDATE];
      const mockResult = [{ role: 'admin', adminPermissions: customPerms }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.getUserPermissions(mockUserId);
      
      expect(result).toEqual(customPerms);
    });

    it('should return default permissions for admin without custom permissions', async () => {
      const mockResult = [{ role: 'admin', adminPermissions: [] }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.getUserPermissions(mockUserId);
      
      expect(result).toEqual(DEFAULT_ADMIN_PERMISSIONS.admin);
    });

    it('should return empty array for regular user', async () => {
      const mockResult = [{ role: 'user', adminPermissions: [] }];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.getUserPermissions(mockUserId);
      
      expect(result).toEqual([]);
    });

    it('should return empty array when user not found', async () => {
      const mockResult: any[] = [];
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.getUserPermissions(mockUserId);
      
      expect(result).toEqual([]);
    });
  });

  describe('checkPermission', () => {
    it('should return true when user has the permission', async () => {
      // Mock getUserPermissions to return specific permissions
      vi.spyOn(AdminService, 'getUserPermissions').mockResolvedValue([
        ADMIN_PERMISSIONS.USER_VIEW,
        ADMIN_PERMISSIONS.USER_UPDATE,
      ]);

      const result = await AdminService.checkPermission(mockUserId, ADMIN_PERMISSIONS.USER_VIEW);
      
      expect(result).toBe(true);
    });

    it('should return false when user lacks the permission', async () => {
      vi.spyOn(AdminService, 'getUserPermissions').mockResolvedValue([
        ADMIN_PERMISSIONS.USER_VIEW,
      ]);

      const result = await AdminService.checkPermission(mockUserId, ADMIN_PERMISSIONS.USER_DELETE);
      
      expect(result).toBe(false);
    });
  });

  describe('promoteToAdmin', () => {
    it('should promote user to admin with default permissions', async () => {
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.update).mockReturnValue(mockQuery as any);

      await AdminService.promoteToAdmin(mockUserId);

      expect(db.update).toHaveBeenCalledWith(user);
      expect(mockQuery.set).toHaveBeenCalledWith({
        role: 'admin',
        adminPermissions: DEFAULT_ADMIN_PERMISSIONS.admin,
      });
    });

    it('should promote user to system_admin with all permissions', async () => {
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.update).mockReturnValue(mockQuery as any);

      await AdminService.promoteToAdmin(mockUserId, 'system_admin');

      expect(mockQuery.set).toHaveBeenCalledWith({
        role: 'system_admin',
        adminPermissions: DEFAULT_ADMIN_PERMISSIONS.system_admin,
      });
    });

    it('should promote user with custom permissions', async () => {
      const customPerms = [ADMIN_PERMISSIONS.USER_VIEW];
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.update).mockReturnValue(mockQuery as any);

      await AdminService.promoteToAdmin(mockUserId, 'admin', customPerms);

      expect(mockQuery.set).toHaveBeenCalledWith({
        role: 'admin',
        adminPermissions: customPerms,
      });
    });
  });

  describe('demoteToUser', () => {
    it('should remove admin role and permissions', async () => {
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.update).mockReturnValue(mockQuery as any);

      await AdminService.demoteToUser(mockUserId);

      expect(db.update).toHaveBeenCalledWith(user);
      expect(mockQuery.set).toHaveBeenCalledWith({
        role: 'user',
        adminPermissions: [],
        lastAdminActivityAt: null,
      });
    });
  });

  describe('updatePermissions', () => {
    it('should update user permissions', async () => {
      const newPerms = [ADMIN_PERMISSIONS.USER_VIEW, ADMIN_PERMISSIONS.CONTENT_VIEW_ALL];
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.update).mockReturnValue(mockQuery as any);

      await AdminService.updatePermissions(mockUserId, newPerms);

      expect(mockQuery.set).toHaveBeenCalledWith({
        adminPermissions: newPerms,
      });
    });
  });

  describe('recordAdminActivity', () => {
    it('should update lastAdminActivityAt timestamp', async () => {
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(db.update).mockReturnValue(mockQuery as any);

      const beforeTime = new Date();
      await AdminService.recordAdminActivity(mockUserId);
      const afterTime = new Date();

      expect(db.update).toHaveBeenCalledWith(user);
      expect(mockQuery.set).toHaveBeenCalled();
      
      const setCall = mockQuery.set.mock.calls[0][0];
      expect(setCall.lastAdminActivityAt).toBeInstanceOf(Date);
      expect(setCall.lastAdminActivityAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(setCall.lastAdminActivityAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('getAllAdmins', () => {
    it('should return all admin users', async () => {
      const mockAdmins = [
        {
          id: 'admin1',
          email: 'admin1@test.com',
          name: 'Admin One',
          role: 'admin',
          adminPermissions: DEFAULT_ADMIN_PERMISSIONS.admin,
          lastAdminActivityAt: new Date(),
        },
        {
          id: 'admin2',
          email: 'admin2@test.com',
          name: 'Admin Two',
          role: 'admin',
          adminPermissions: [ADMIN_PERMISSIONS.USER_VIEW],
          lastAdminActivityAt: null,
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockAdmins),
      };
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const result = await AdminService.getAllAdmins();

      expect(result).toEqual(mockAdmins);
      expect(db.select).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        adminPermissions: user.adminPermissions,
        lastAdminActivityAt: user.lastAdminActivityAt,
      });
    });
  });
});