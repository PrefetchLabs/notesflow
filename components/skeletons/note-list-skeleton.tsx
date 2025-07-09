import { Skeleton } from '@/components/ui/skeleton';

interface NoteListSkeletonProps {
  count?: number;
}

export function NoteListSkeleton({ count = 5 }: NoteListSkeletonProps) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}