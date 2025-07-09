import { Skeleton } from '@/components/ui/skeleton';

export function EditorSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Editor header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Editor toolbar */}
      <div className="border-b px-6 py-2">
        <div className="flex items-center gap-1">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
          <div className="mx-2 h-6 w-px bg-border" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}