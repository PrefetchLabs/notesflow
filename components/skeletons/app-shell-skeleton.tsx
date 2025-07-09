import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AppShellSkeletonProps {
  sidebarCollapsed?: boolean;
}

export function AppShellSkeleton({ sidebarCollapsed = false }: AppShellSkeletonProps) {
  return (
    <div
      className={cn(
        'app-shell min-h-screen bg-background',
        'grid transition-all duration-300 ease-in-out',
        sidebarCollapsed
          ? 'grid-cols-[60px_1fr]'
          : 'grid-cols-[280px_1fr]'
      )}
    >
      {/* Sidebar skeleton */}
      <aside
        className={cn(
          'sidebar relative flex h-screen flex-col border-r bg-background',
          sidebarCollapsed ? 'w-[60px]' : 'w-[280px]'
        )}
      >
        {/* User profile skeleton */}
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            {!sidebarCollapsed && (
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            )}
          </div>
        </div>

        {/* Folder tree skeleton */}
        <div className="flex-1 p-4">
          <div className="space-y-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5',
                  sidebarCollapsed && 'justify-center'
                )}
              >
                <Skeleton className="h-4 w-4" />
                {!sidebarCollapsed && <Skeleton className="h-4 flex-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section skeleton */}
        <div className="border-t p-4">
          <Skeleton className={cn('h-8', sidebarCollapsed ? 'w-8' : 'w-full')} />
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="main-content overflow-hidden">
        <div className="h-full w-full">
          <Skeleton className="h-full w-full" />
        </div>
      </main>
    </div>
  );
}