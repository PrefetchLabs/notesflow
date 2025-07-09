'use client';

import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { toast } from 'sonner';

const FREE_TIER_LIMIT = 10; // 10 AI calls per day for free tier

interface AIUsageData {
  total_requests: number;
  current_month: string;
}

export function AIUsageIndicator() {
  const [usage, setUsage] = useState<number>(0);
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
        console.error('Failed to fetch AI usage');
        return;
      }

      const data = await response.json();
      setUsage(data.currentUsage || 0);
    } catch (error) {
      console.error('Error fetching AI usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const remainingCalls = Math.max(0, FREE_TIER_LIMIT - usage);
  const progressValue = (usage / FREE_TIER_LIMIT) * 100;
  const isNearLimit = remainingCalls <= 3;
  const isAtLimit = remainingCalls === 0;

  if (loading) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
      <Sparkles className={`h-4 w-4 ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-muted-foreground'}`} />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            AI Usage: {usage}/{FREE_TIER_LIMIT}
          </span>
          {isAtLimit && (
            <span className="text-xs text-destructive font-medium">
              Limit reached
            </span>
          )}
        </div>
        <Progress 
          value={progressValue} 
          className="h-1 w-24"
          indicatorClassName={isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-warning' : ''}
        />
      </div>
    </div>
  );
}