import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../users/route';
import { authMiddleware } from '@/lib/auth/auth-server';
import { AdminService } from '@/lib/auth/admin-service';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';
import { db } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/auth/auth-server');
vi.mock('@/lib/auth/admin-service');
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
  },
}));

describe('Admin Users API', () => {
  const mockUserId = 'admin-user-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(authMiddleware).mockResolvedValue({
        success: false,
        error: 'No authenticated user',
        user: null,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 403 when user lacks USER_VIEW permission', async () => {
      vi.mocked(authMiddleware).mockResolvedValue({
        success: true,
        user: {
          id: mockUserId,
          email: 'admin@test.com',
          name: 'Admin User',
          image: null,
        },
        session: {} as any,
      });

      vi.mocked(AdminService.checkPermission).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Insufficient permissions' });
      expect(AdminService.checkPermission).toHaveBeenCalledWith(
        mockUserId,
        ADMIN_PERMISSIONS.USER_VIEW
      );
    });

    it('should return paginated users when authorized', async () => {
      vi.mocked(authMiddleware).mockResolvedValue({
        success: true,
        user: {
          id: mockUserId,
          email: 'admin@test.com',
          name: 'Admin User',
          image: null,
        },
        session: {} as any,
      });

      vi.mocked(AdminService.checkPermission).mockResolvedValue(true);

      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          name: 'User One',
          role: 'user',
          emailVerified: true,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'user2',
          email: 'user2@test.com',
          name: 'User Two',
          role: 'admin',
          emailVerified: false,
          createdAt: new Date('2024-01-02'),
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockUsers),
      };
      
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      // Mock count query
      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      };
      
      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any)
        .mockReturnValueOnce(mockCountQuery as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('totalCount', 2);
      expect(data).toHaveProperty('page', 1);
      expect(data).toHaveProperty('limit', 10);
      expect(data).toHaveProperty('totalPages', 1);
    });

    it('should handle search parameter correctly', async () => {
      vi.mocked(authMiddleware).mockResolvedValue({
        success: true,
        user: {
          id: mockUserId,
          email: 'admin@test.com',
          name: 'Admin User',
          image: null,
        },
        session: {} as any,
      });

      vi.mocked(AdminService.checkPermission).mockResolvedValue(true);

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };
      
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      
      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any)
        .mockReturnValueOnce(mockCountQuery as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users?search=test@example.com');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockQuery.where).toHaveBeenCalled();
    });

    it('should handle role filter correctly', async () => {
      vi.mocked(authMiddleware).mockResolvedValue({
        success: true,
        user: {
          id: mockUserId,
          email: 'admin@test.com',
          name: 'Admin User',
          image: null,
        },
        session: {} as any,
      });

      vi.mocked(AdminService.checkPermission).mockResolvedValue(true);

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };
      
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      
      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any)
        .mockReturnValueOnce(mockCountQuery as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users?role=admin');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockQuery.where).toHaveBeenCalled();
    });

    it('should handle sorting parameters correctly', async () => {
      vi.mocked(authMiddleware).mockResolvedValue({
        success: true,
        user: {
          id: mockUserId,
          email: 'admin@test.com',
          name: 'Admin User',
          image: null,
        },
        session: {} as any,
      });

      vi.mocked(AdminService.checkPermission).mockResolvedValue(true);

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };
      
      vi.mocked(db.select).mockReturnValue(mockQuery as any);

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };
      
      vi.mocked(db.select).mockReturnValueOnce(mockQuery as any)
        .mockReturnValueOnce(mockCountQuery as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users?sortBy=email&sortOrder=asc');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockQuery.orderBy).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(authMiddleware).mockResolvedValue({
        success: true,
        user: {
          id: mockUserId,
          email: 'admin@test.com',
          name: 'Admin User',
          image: null,
        },
        session: {} as any,
      });

      vi.mocked(AdminService.checkPermission).mockResolvedValue(true);

      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch users' });
    });
  });
});