import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard';
import { AdminSidebar } from '@/components/layouts/admin-sidebar';
import { AdminMobileHeader } from '@/components/layouts/admin-mobile-header';
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
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Admin Sidebar - Desktop */}
        <AdminSidebar className="hidden md:flex" />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <AdminMobileHeader />
          
          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </AdminRouteGuard>
  );
}