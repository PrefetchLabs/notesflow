'use client';

import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Infinity } from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';

interface AIUsageData {
  currentUsage: number;
  limit: number;
  hasReachedLimit: boolean;
  remainingCalls: number;
}

export function AIUsageIndicator() {
  const [usageData, setUsageData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      fetchUsage();
    }
  }, [session]);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/ai/usage');
      if (!response.ok) {
        // [REMOVED_CONSOLE]
        return;
      }

      const data: AIUsageData = await response.json();
      setUsageData(data);
    } catch (error) {
      // [REMOVED_CONSOLE]
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usageData) return null;

  const isUnlimited = usageData.limit === Infinity;
  const remainingCalls = usageData.remainingCalls;
  const progressValue = isUnlimited ? 0 : (usageData.currentUsage / usageData.limit) * 100;
  const isNearLimit = !isUnlimited && remainingCalls <= 3 && remainingCalls > 0;
  const isAtLimit = !isUnlimited && usageData.hasReachedLimit;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
      <Sparkles className={`h-4 w-4 ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-muted-foreground'}`} />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isUnlimited ? (
              <span className="flex items-center gap-1">
                AI Usage: Unlimited
                <Infinity className="h-3 w-3" />
              </span>
            ) : (
              `AI Usage: ${usageData.currentUsage}/${usageData.limit}`
            )}
          </span>
          {isAtLimit && (
            <span className="text-xs text-destructive font-medium">
              Limit reached
            </span>
          )}
        </div>
        {!isUnlimited && (
          <Progress 
            value={progressValue} 
            className="h-1 w-24"
            indicatorClassName={isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-warning' : ''}
          />
        )}
      </div>
    </div>
  );
}