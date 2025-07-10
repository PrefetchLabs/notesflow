import { requireAdmin } from '@/lib/auth/admin-auth';
import { DashboardStats } from '@/components/admin/dashboard-stats';
import { RecentActivity } from '@/components/admin/recent-activity';
import { QuickActions } from '@/components/admin/quick-actions';

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

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity - Takes up more space */}
        <div className="col-span-full lg:col-span-4">
          <RecentActivity />
        </div>

        {/* Quick Actions - Smaller section */}
        <div className="col-span-full lg:col-span-3">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}