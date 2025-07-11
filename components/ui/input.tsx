import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-all duration-200',
        'placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'selection:bg-primary/20 selection:text-foreground',
        className
      )}
      {...props}
    />
  );
}

export { Input };
