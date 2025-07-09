import { Skeleton } from '@/components/ui/skeleton';

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="p-2 text-center">
              <Skeleton className="mx-auto h-4 w-8" />
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square border-r border-b p-2 last:border-r-0">
              <Skeleton className="mb-1 h-4 w-6" />
              <div className="space-y-1">
                {i % 7 === 0 || i % 7 === 6 ? null : (
                  <>
                    {i % 3 === 0 && <Skeleton className="h-6 w-full" />}
                    {i % 5 === 0 && <Skeleton className="h-6 w-full" />}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time blocks list */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border p-3">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}