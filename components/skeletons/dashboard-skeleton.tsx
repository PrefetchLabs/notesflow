import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header skeleton */}
      <header className="border-b px-6 py-4">
        <Skeleton className="h-8 w-32" />
      </header>
      
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="h-5 w-64" />
          
          {/* Stats skeleton */}
          <div className="mt-8 rounded-lg border bg-card p-6">
            <Skeleton className="h-6 w-24" />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg bg-background p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-2 h-8 w-12" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent activity skeleton */}
          <div className="mt-8 rounded-lg border bg-card p-6">
            <Skeleton className="h-6 w-32" />
            <div className="mt-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}