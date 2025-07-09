import { useState, useEffect, useCallback } from 'react';
import { debounce } from '@/lib/utils/debounce';

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    // Initialize with actual values to prevent layout shift
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: undefined, height: undefined };
  });

  useEffect(() => {
    // Handler to call on window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Debounce the resize handler to prevent excessive updates
    const debouncedHandleResize = debounce(handleResize, 150);

    // Add event listener
    window.addEventListener('resize', debouncedHandleResize);

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, []);

  return windowSize;
}