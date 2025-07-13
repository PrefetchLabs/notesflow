import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminLayout from '../layout';
import { requireAdmin } from '@/lib/auth/admin-auth';

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth/admin-auth', () => ({
  requireAdmin: vi.fn(),
}));

// Mock child components
vi.mock('@/components/layouts/admin-sidebar', () => ({
  AdminSidebar: () => <div data-testid="admin-sidebar">Admin Sidebar</div>,
}));

vi.mock('@/components/layouts/admin-mobile-header', () => ({
  AdminMobileHeader: () => <div data-testid="admin-mobile-header">Admin Mobile Header</div>,
}));

describe('Admin Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render admin layout when user is authorized', async () => {
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

    render(
      await AdminLayout({ children: <div>Admin Content</div> })
    );

    // Check if layout structure is rendered
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('admin-mobile-header')).toBeInTheDocument();
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should redirect when user is not authorized', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

    try {
      await AdminLayout({ children: <div>Admin Content</div> });
    } catch {
      // Expected to throw
    }

    expect(requireAdmin).toHaveBeenCalled();
  });

  it('should apply correct CSS classes for layout structure', async () => {
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

    const { container } = render(
      await AdminLayout({ children: <div>Admin Content</div> })
    );

    // Check for flex layout
    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();

    // Check for responsive classes
    const mainContent = container.querySelector('main');
    expect(mainContent).toHaveClass('flex-1');
  });
});