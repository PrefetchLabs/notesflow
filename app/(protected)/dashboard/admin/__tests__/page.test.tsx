import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminDashboard from '../page';
import { requireAdmin } from '@/lib/auth/admin-auth';

// Mock dependencies
vi.mock('@/lib/auth/admin-auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/components/admin/dashboard-stats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats">Dashboard Stats</div>,
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Admin Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard with stats when user is authorized', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin User',
      },
      isSystemAdmin: false,
      permissions: [],
    });

    const mockStats = {
      users: {
        total: 100,
        active: 85,
        newThisMonth: 15,
      },
      notes: {
        total: 500,
        activeUsers: 75,
        averagePerUser: 6.7,
      },
      folders: {
        total: 200,
        averagePerUser: 2.7,
      },
      subscriptions: {
        total: 30,
        active: 25,
        revenue: 2500,
      },
      growth: {
        users: 15,
        notes: 25,
        revenue: 10,
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const Page = await AdminDashboard();
    const { container } = render(Page);

    // Check page title
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Platform overview and statistics')).toBeInTheDocument();

    // Check if stats component is rendered
    expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
  });

  it('should handle stats fetch error gracefully', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin User',
      },
      isSystemAdmin: false,
      permissions: [],
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const Page = await AdminDashboard();
    render(Page);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch stats:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should display system admin badge when user is system admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin User',
      },
      isSystemAdmin: true,
      permissions: [],
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const Page = await AdminDashboard();
    render(Page);

    const badge = screen.getByText('System Admin');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('should display regular admin badge when user is not system admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin User',
      },
      isSystemAdmin: false,
      permissions: [],
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const Page = await AdminDashboard();
    render(Page);

    const badge = screen.getByText('Admin');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });
});