import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProBadgeProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProBadge({ className, showText = true, size = 'sm' }: ProBadgeProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-primary',
      className
    )}>
      <Sparkles className={sizeClasses[size]} />
      {showText && <span className={cn('font-medium', textSizes[size])}>PRO</span>}
    </span>
  );
}