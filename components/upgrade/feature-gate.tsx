'use client';

import { ReactNode } from 'react';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { ProBadge } from './pro-badge';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  feature: 'ai' | 'collaboration' | 'sharing' | 'unlimited' | 'themes' | 'export';
  children: ReactNode;
  fallback?: ReactNode;
  showBadge?: boolean;
  className?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showBadge = true,
  className 
}: FeatureGateProps) {
  const { isFreeTier, hasFeatureAccess } = useSubscription();

  const hasAccess = hasFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn('relative', className)}>
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      {showBadge && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full shadow-sm">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <ProBadge size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}

// Component to wrap menu items or buttons that require pro
interface ProFeatureWrapperProps {
  feature: 'ai' | 'collaboration' | 'sharing' | 'unlimited' | 'themes' | 'export';
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  showTooltip?: boolean;
}

export function ProFeatureWrapper({ 
  feature, 
  children, 
  onClick,
  className,
  showTooltip = true 
}: ProFeatureWrapperProps) {
  const { hasFeatureAccess, showFeatureLockedToast } = useSubscription();

  const hasAccess = hasFeatureAccess(feature);

  const handleClick = () => {
    if (!hasAccess) {
      showFeatureLockedToast(feature);
      return;
    }
    onClick?.();
  };

  return (
    <div 
      className={cn(
        'relative',
        !hasAccess && 'cursor-not-allowed',
        className
      )}
      onClick={handleClick}
    >
      {children}
      {!hasAccess && (
        <ProBadge 
          className="absolute -top-1 -right-1" 
          showText={false}
          size="sm"
        />
      )}
    </div>
  );
}