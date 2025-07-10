import { requireAdmin } from '@/lib/auth/admin-auth';
import { DashboardStats } from '@/components/admin/dashboard-stats';

export default async function AdminDashboard() {
  const { user, isSystemAdmin } = await requireAdmin();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role:</span>
          <span className="text-sm font-medium">
            {isSystemAdmin ? 'System Admin' : 'Admin'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats />
    </div>
  );
}