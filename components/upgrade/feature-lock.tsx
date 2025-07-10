'use client';

import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FeatureLockProps {
  featureName: string;
  description?: string;
  children?: React.ReactNode;
  variant?: 'overlay' | 'inline' | 'card';
  className?: string;
  onUpgradeClick?: () => void;
}

export function FeatureLock({
  featureName,
  description,
  children,
  variant = 'overlay',
  className,
  onUpgradeClick
}: FeatureLockProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      router.push('/upgrade');
    }
  };

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Lock className="h-4 w-4" />
        <span className="text-sm">{featureName}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-auto py-0.5 px-2 text-xs"
          onClick={handleUpgrade}
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Pro
        </Button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center",
        className
      )}>
        <div className="mx-auto mb-4 w-fit rounded-full bg-background p-3">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-semibold">{featureName}</h3>
        {description && (
          <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        )}
        <Button onClick={handleUpgrade}>
          <Sparkles className="mr-2 h-4 w-4" />
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  // Default overlay variant
  return (
    <div className={cn("relative", className)}>
      {children && (
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center space-y-4 p-6 max-w-sm">
          <div className="mx-auto w-fit rounded-full bg-muted p-3">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">{featureName}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button onClick={handleUpgrade} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to unlock
          </Button>
        </div>
      </div>
    </div>
  );
}