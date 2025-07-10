'use client';

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UsageIndicatorProps {
  used: number;
  limit: number;
  label: string;
  unit?: string;
  showUpgrade?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export function UsageIndicator({
  used,
  limit,
  label,
  unit = 'items',
  showUpgrade = true,
  variant = 'default',
  className
}: UsageIndicatorProps) {
  const router = useRouter();
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;

  const getStatusColor = () => {
    if (isAtLimit) return 'destructive';
    if (isNearLimit) return 'warning';
    return 'default';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-destructive';
    if (isNearLimit) return 'bg-orange-500';
    return 'bg-primary';
  };

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className={cn(
            "font-medium",
            isAtLimit && "text-destructive",
            isNearLimit && !isAtLimit && "text-orange-600"
          )}>
            {used}/{limit} {unit}
          </span>
        </div>
        <Progress 
          value={percentage} 
          className="h-1.5"
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-3",
      isAtLimit && "border-destructive/50 bg-destructive/5",
      isNearLimit && !isAtLimit && "border-orange-500/50 bg-orange-500/5",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{label}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {used} of {limit} {unit} used
          </p>
        </div>
        {(isNearLimit || isAtLimit) && (
          <AlertCircle className={cn(
            "h-5 w-5",
            isAtLimit ? "text-destructive" : "text-orange-500"
          )} />
        )}
      </div>

      <Progress 
        value={percentage} 
        className="h-2"
      />

      {isAtLimit && (
        <div className="pt-2 space-y-2">
          <p className="text-sm text-destructive">
            You've reached your {label.toLowerCase()} limit.
          </p>
          {showUpgrade && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => router.push('/upgrade')}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade for unlimited {unit}
            </Button>
          )}
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <p className="text-sm text-orange-600">
          You're approaching your {label.toLowerCase()} limit.
        </p>
      )}
    </div>
  );
}