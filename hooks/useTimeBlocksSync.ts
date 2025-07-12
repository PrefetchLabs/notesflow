import { useEffect, useRef } from 'react';

interface UseTimeBlocksSyncProps {
  isEnabled: boolean;
  onSync: () => void;
  interval?: number; // milliseconds
}

export function useTimeBlocksSync({ 
  isEnabled, 
  onSync, 
  interval = 5000 // 5 seconds default
}: UseTimeBlocksSyncProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!isEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    // Initial sync
    onSync();
    
    // Set up polling
    intervalRef.current = setInterval(() => {
      onSync();
    }, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled, onSync, interval]);
}