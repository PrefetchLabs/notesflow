import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { useAuth } from '@/lib/auth/auth-hooks';

interface PlanBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function PlanBadge({ className, size = 'sm', showIcon = true }: PlanBadgeProps) {
  const { user } = useAuth();
  const { isPro, isBeta, isFreeTier, subscription } = useSubscription();
  
  // Check admin status first, before subscription status
  const isAdmin = user?.role === 'admin';

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (isAdmin) {
    return (
      <Badge
        variant="secondary"
        className={cn(sizeClasses[size], 'gap-1', className)}
      >
        {showIcon && <Shield className={iconSizes[size]} />}
        Admin
      </Badge>
    );
  }

  if (isPro && !isAdmin) {
    return (
      <Badge
        className={cn(
          sizeClasses[size],
          'gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0',
          className
        )}
      >
        {showIcon && <Sparkles className={iconSizes[size]} />}
        Pro
      </Badge>
    );
  }

  if (isBeta) {
    return (
      <Badge
        className={cn(
          sizeClasses[size],
          'gap-1 bg-gradient-to-r from-green-600 to-teal-600 text-white border-0',
          className
        )}
      >
        {showIcon && <Zap className={iconSizes[size]} />}
        Beta
      </Badge>
    );
  }

  // Free tier
  return (
    <Badge
      variant="outline"
      className={cn(sizeClasses[size], 'gap-1', className)}
    >
      Free
    </Badge>
  );
}