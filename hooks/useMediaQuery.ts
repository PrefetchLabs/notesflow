import { useState, useEffect, useMemo } from 'react';

export function useMediaQuery(query: string): boolean {
  // Memoize the media query to prevent recreating it on every render
  const mediaQuery = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query);
    }
    return null;
  }, [query]);

  const [matches, setMatches] = useState(() => {
    // Initialize with actual value to prevent layout shift
    if (mediaQuery) {
      return mediaQuery.matches;
    }
    return false;
  });

  useEffect(() => {
    if (!mediaQuery) return;

    // Define the listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set the initial value
    setMatches(mediaQuery.matches);

    // Add the listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(listener);
    }

    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(listener);
      }
    };
  }, [mediaQuery]);

  return matches;
}