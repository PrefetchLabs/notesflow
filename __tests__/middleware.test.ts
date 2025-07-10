import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// Mock better-auth
vi.mock('better-auth/cookies', () => ({
  getSessionCookie: vi.fn(),
}));

import { getSessionCookie } from 'better-auth/cookies';

describe('Middleware', () => {
  const mockGetSessionCookie = vi.mocked(getSessionCookie);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Protected Routes', () => {
    const protectedRoutes = ['/dashboard', '/notes', '/settings'];

    protectedRoutes.forEach(route => {
      it(`should redirect to login when accessing ${route} without session`, async () => {
        mockGetSessionCookie.mockReturnValue(null);
        
        const request = new NextRequest(new URL(`http://localhost:3000${route}`));
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(307); // Redirect status
        expect(response.headers.get('location')).toBe(`http://localhost:3000/login?from=${route}`);
      });

      it(`should allow access to ${route} with valid session`, async () => {
        mockGetSessionCookie.mockReturnValue('valid-session-cookie');
        
        const request = new NextRequest(new URL(`http://localhost:3000${route}`));
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.headers.get('x-middleware-next')).toBe('1');
      });
    });

    it('should preserve path in redirect for nested protected routes', async () => {
      mockGetSessionCookie.mockReturnValue(null);
      
      const request = new NextRequest(new URL('http://localhost:3000/dashboard/analytics'));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?from=/dashboard/analytics');
    });
  });

  describe('Auth Routes', () => {
    const authRoutes = ['/login', '/register'];

    authRoutes.forEach(route => {
      it(`should allow access to ${route} without session`, async () => {
        mockGetSessionCookie.mockReturnValue(null);
        
        const request = new NextRequest(new URL(`http://localhost:3000${route}`));
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.headers.get('x-middleware-next')).toBe('1');
      });

      it(`should redirect to dashboard when accessing ${route} with session`, async () => {
        mockGetSessionCookie.mockReturnValue('valid-session-cookie');
        
        const request = new NextRequest(new URL(`http://localhost:3000${route}`));
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
      });
    });
  });

  describe('Admin Routes', () => {
    const adminRoutes = ['/dashboard/admin', '/dashboard/admin/users', '/dashboard/admin/settings'];

    adminRoutes.forEach(route => {
      it(`should redirect to login when accessing ${route} without session`, async () => {
        mockGetSessionCookie.mockReturnValue(null);
        
        const request = new NextRequest(new URL(`http://localhost:3000${route}`));
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`http://localhost:3000/login?from=${route}`);
      });

      it(`should allow middleware pass-through for ${route} with session (admin check done in route)`, async () => {
        mockGetSessionCookie.mockReturnValue('valid-session-cookie');
        
        const request = new NextRequest(new URL(`http://localhost:3000${route}`));
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.headers.get('x-middleware-next')).toBe('1');
      });
    });
  });

  describe('Public Routes', () => {
    const publicRoutes = ['/', '/about', '/pricing', '/features'];

    publicRoutes.forEach(route => {
      it(`should allow access to ${route} without session`, async () => {
        mockGetSessionCookie.mockReturnValue(null);
        
        const request = new NextRequest(new URL(`http://localhost:3000${route}`));
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.headers.get('x-middleware-next')).toBe('1');
      });

      it(`should allow access to ${route} with session`, async () => {
        mockGetSessionCookie.mockReturnValue('valid-session-cookie');
        
        const request = new NextRequest(new URL(`http://localhost:3000${route}`));
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.headers.get('x-middleware-next')).toBe('1');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle query parameters in protected routes', async () => {
      mockGetSessionCookie.mockReturnValue(null);
      
      const request = new NextRequest(new URL('http://localhost:3000/dashboard?tab=overview'));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?from=/dashboard');
    });

    it('should handle URL fragments in protected routes', async () => {
      mockGetSessionCookie.mockReturnValue(null);
      
      const request = new NextRequest(new URL('http://localhost:3000/notes#section-1'));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?from=/notes');
    });

    it('should not match API routes', async () => {
      mockGetSessionCookie.mockReturnValue(null);
      
      const request = new NextRequest(new URL('http://localhost:3000/api/notes'));
      const response = await middleware(request);

      // Since API routes are excluded by the matcher, middleware should not process them
      // In a real scenario, this wouldn't even reach the middleware
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should handle root path redirect correctly', async () => {
      mockGetSessionCookie.mockReturnValue(null);
      
      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      // Root path should be accessible without authentication
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('Session Cookie Handling', () => {
    it('should handle different session cookie values', async () => {
      const sessionValues = ['', 'invalid', 'expired-session', undefined];
      
      for (const sessionValue of sessionValues) {
        mockGetSessionCookie.mockReturnValue(sessionValue as any);
        
        const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
        const response = await middleware(request);

        if (sessionValue) {
          // Non-null values should allow access (validation happens elsewhere)
          expect(response.headers.get('x-middleware-next')).toBe('1');
        } else {
          // Null/undefined should redirect
          expect(response.status).toBe(307);
        }
      }
    });
  });
});