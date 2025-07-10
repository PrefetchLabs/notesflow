import { requireAdmin } from '@/lib/auth/admin-auth';

export default async function AdminDashboard() {
  const { user, isSystemAdmin, permissions } = await requireAdmin();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Admin Information</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Admin Level</dt>
              <dd className="text-sm">{isSystemAdmin ? 'System Admin' : 'Admin'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Permissions</dt>
              <dd className="text-sm">
                {permissions.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {permissions.map((permission) => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground">No specific permissions</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/users" className="block">
            <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold mb-2">User Management</h3>
              <p className="text-sm text-muted-foreground">
                View and manage platform users
              </p>
            </div>
          </a>

          <a href="/admin/content" className="block">
            <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold mb-2">Content Moderation</h3>
              <p className="text-sm text-muted-foreground">
                Review and moderate user content
              </p>
            </div>
          </a>

          <a href="/admin/analytics" className="block">
            <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                View platform metrics and reports
              </p>
            </div>
          </a>

          <a href="/admin/system" className="block">
            <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold mb-2">System Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure platform settings
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}