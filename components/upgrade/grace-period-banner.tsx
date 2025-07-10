'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { X, Clock, Gift, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getGracePeriodMessage, getGracePeriodUrgency, shouldShowGracePeriodBanner } from '@/lib/services/grace-period';

export function GracePeriodBanner() {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const { isInNewUserGracePeriod, gracePeriodDaysRemaining, gracePeriodHoursRemaining, isFreeTier } = useSubscription();

  // Reset dismissed state when grace period changes significantly
  useEffect(() => {
    if (gracePeriodDaysRemaining === 1 || gracePeriodDaysRemaining === 0) {
      setIsDismissed(false);
    }
  }, [gracePeriodDaysRemaining]);

  const gracePeriodInfo = {
    isInGracePeriod: isInNewUserGracePeriod,
    gracePeriodEndsAt: null,
    daysRemaining: gracePeriodDaysRemaining,
    hoursRemaining: gracePeriodHoursRemaining || 0,
  };

  if (!isFreeTier || !shouldShowGracePeriodBanner(gracePeriodInfo) || isDismissed) {
    return null;
  }

  const urgency = getGracePeriodUrgency(gracePeriodDaysRemaining);
  
  const getMessage = () => {
    const baseMessage = getGracePeriodMessage(gracePeriodDaysRemaining);
    if (gracePeriodDaysRemaining === 0 && gracePeriodHoursRemaining) {
      return `${baseMessage} Only ${gracePeriodHoursRemaining} hours remaining!`;
    }
    return baseMessage + ' Upgrade to keep all pro features.';
  };

  const getBannerColor = () => {
    const urgencyColors = {
      low: 'bg-green-500/10 border-green-500/20',
      medium: 'bg-blue-500/10 border-blue-500/20',
      high: 'bg-orange-500/10 border-orange-500/20',
      critical: 'bg-red-500/10 border-red-500/20',
    };
    return urgencyColors[urgency];
  };

  const getIcon = () => {
    if (urgency === 'critical') return AlertCircle;
    if (urgency === 'high') return Clock;
    return Gift;
  };

  const Icon = getIcon();

  return (
    <div className={cn(
      "relative flex items-center gap-3 px-4 py-3 border rounded-lg",
      getBannerColor()
    )}>
      <Icon className="h-5 w-5 text-primary flex-shrink-0" />
      
      <div className="flex-1">
        <p className="text-sm font-medium">{getMessage()}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={urgency === 'critical' || urgency === 'high' ? "default" : "outline"}
          onClick={() => router.push('/upgrade')}
          className={cn(
            urgency === 'critical' && 'animate-pulse'
          )}
        >
          {urgency === 'critical' || urgency === 'high' ? 'Upgrade Now' : 'View Plans'}
        </Button>
        
        {urgency !== 'critical' && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}