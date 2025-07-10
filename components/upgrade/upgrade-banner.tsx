'use client';

import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpgradeBannerProps {
  title: string;
  description: string;
  onDismiss?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function UpgradeBanner({
  title,
  description,
  onDismiss,
  variant = 'default',
  className = ''
}: UpgradeBannerProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between gap-4 rounded-lg bg-primary/10 p-3 ${className}`}>
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm">
            <span className="font-medium">{title}</span> • {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push('/upgrade')}
          >
            Upgrade
          </Button>
          {onDismiss && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 ${className}`}>
      {onDismiss && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary/20 p-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => router.push('/upgrade')}>
              Upgrade to Pro
            </Button>
            <Button variant="ghost" onClick={() => router.push('/pricing')}>
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}