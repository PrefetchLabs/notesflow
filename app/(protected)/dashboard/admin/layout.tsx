import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard';
import { Loader2 } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin check
  await requireAdmin();

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-background">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </AdminRouteGuard>
  );
}