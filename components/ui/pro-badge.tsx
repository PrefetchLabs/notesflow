'use client';

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'subtle';
  showIcon?: boolean;
  className?: string;
}

export function ProBadge({ 
  size = 'sm', 
  variant = 'default',
  showIcon = true,
  className 
}: ProBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0 h-5",
    md: "text-sm px-2 py-0.5 h-6",
    lg: "text-base px-3 py-1 h-7"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  };

  if (variant === 'subtle') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-muted-foreground",
        sizeClasses[size],
        className
      )}>
        {showIcon && <Sparkles className={iconSizes[size]} />}
        <span>Pro</span>
      </span>
    );
  }

  return (
    <Badge
      variant={variant === 'outline' ? 'outline' : 'default'}
      className={cn(
        "gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0",
        variant === 'outline' && "bg-transparent text-purple-600 border-purple-600",
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Sparkles className={iconSizes[size]} />}
      Pro
    </Badge>
  );
}