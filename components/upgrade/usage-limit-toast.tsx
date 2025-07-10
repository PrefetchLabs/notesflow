'use client';

import { toast } from "sonner";
import { AlertCircle, Sparkles } from "lucide-react";

interface UsageLimitToastOptions {
  feature: string;
  limit: number;
  current: number;
  unit?: string;
}

export function showUsageLimitToast({ 
  feature, 
  limit, 
  current, 
  unit = 'items' 
}: UsageLimitToastOptions) {
  
  if (current >= limit) {
    toast.error(
      `You've reached your ${feature} limit`,
      {
        description: `Free plan allows ${limit} ${unit}. Upgrade to Pro for unlimited access.`,
        icon: <AlertCircle className="h-5 w-5" />,
        action: {
          label: 'Upgrade to Pro',
          onClick: () => window.location.href = '/upgrade',
        },
        duration: 5000,
      }
    );
    return true;
  }

  const remaining = limit - current;
  const percentage = (current / limit) * 100;

  if (percentage >= 80) {
    toast.warning(
      `${feature} limit approaching`,
      {
        description: `You have ${remaining} ${unit} remaining on the free plan.`,
        icon: <Sparkles className="h-5 w-5" />,
        action: {
          label: 'View Plans',
          onClick: () => window.location.href = '/pricing',
        },
        duration: 4000,
      }
    );
  }

  return false;
}

export function showFeatureLockedToast(featureName: string, description?: string) {
  
  toast.error(
    `${featureName} is a Pro feature`,
    {
      description: description || 'Upgrade to Pro to unlock this feature and more.',
      icon: <AlertCircle className="h-5 w-5" />,
      action: {
        label: 'Upgrade to Pro',
        onClick: () => router.push('/upgrade'),
      },
      duration: 5000,
    }
  );
}