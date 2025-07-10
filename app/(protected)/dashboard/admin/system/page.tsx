import { requireAdmin } from '@/lib/auth/admin-auth';
import { ADMIN_PERMISSIONS } from '@/lib/auth/admin-permissions';

export default async function SystemPage() {
  await requireAdmin([ADMIN_PERMISSIONS.SYSTEM_CONFIG_VIEW]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
      </div>
      
      <div className="rounded-lg border bg-card p-8">
        <p className="text-muted-foreground text-center">
          System configuration coming soon...
        </p>
      </div>
    </div>
  );
}