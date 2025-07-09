'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface RelativeTimeProps {
  date: Date | string;
}

export function RelativeTime({ date }: RelativeTimeProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!mounted) {
    // Return a placeholder during SSR to avoid hydration mismatch
    return <span className="text-muted-foreground">...</span>;
  }
  
  return (
    <span className="text-muted-foreground">
      {formatDistanceToNow(dateObj, { addSuffix: true })}
    </span>
  );
}