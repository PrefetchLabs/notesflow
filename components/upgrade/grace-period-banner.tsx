'use client';

import { useState } from 'react';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { X, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function GracePeriodBanner() {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const { isInNewUserGracePeriod, gracePeriodDaysRemaining, isFreeTier } = useSubscription();

  if (!isFreeTier || !isInNewUserGracePeriod || isDismissed || gracePeriodDaysRemaining <= 0) {
    return null;
  }

  const getMessage = () => {
    if (gracePeriodDaysRemaining === 1) {
      return "Last day of your free trial! Upgrade now to keep all pro features.";
    } else if (gracePeriodDaysRemaining <= 3) {
      return `Only ${gracePeriodDaysRemaining} days left in your free trial. Don't lose access to pro features!`;
    } else {
      return `Welcome! You have ${gracePeriodDaysRemaining} days of free pro features to explore.`;
    }
  };

  const getBannerColor = () => {
    if (gracePeriodDaysRemaining === 1) return 'bg-red-500/10 border-red-500/20';
    if (gracePeriodDaysRemaining <= 3) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-green-500/10 border-green-500/20';
  };

  const getIcon = () => {
    if (gracePeriodDaysRemaining <= 3) return Clock;
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
          variant={gracePeriodDaysRemaining <= 3 ? "default" : "outline"}
          onClick={() => router.push('/upgrade')}
        >
          {gracePeriodDaysRemaining <= 3 ? 'Upgrade Now' : 'View Plans'}
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}