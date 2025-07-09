import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface FolderTreeSkeletonProps {
  collapsed?: boolean;
}

export function FolderTreeSkeleton({ collapsed = false }: FolderTreeSkeletonProps) {
  return (
    <div className="space-y-1">
      {/* Header skeleton */}
      <div className={cn(
        'mb-2 flex items-center justify-between',
        collapsed && 'justify-center'
      )}>
        {!collapsed && (
          <Skeleton className="h-4 w-16" />
        )}
        <Skeleton className="h-6 w-6" />
      </div>

      {/* Folder items skeleton */}
      <div className="space-y-0.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5',
              collapsed && 'justify-center'
            )}
            style={{ paddingLeft: collapsed ? '8px' : `${8 + (i % 3) * 16}px` }}
          >
            <Skeleton className="h-4 w-4" />
            {!collapsed && (
              <>
                <Skeleton className="h-4 flex-1" style={{ width: `${100 - (i % 3) * 20}%` }} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick access skeleton */}
      {!collapsed && (
        <div className="mt-6">
          <Skeleton className="mb-2 h-4 w-24" />
          <div className="space-y-0.5">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}