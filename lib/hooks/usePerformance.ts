import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export function usePerformance(componentName: string) {
  const renderStartTime = useRef<number>(performance.now());
  const isFirstRender = useRef(true);

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;

    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now(),
    };

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      // [REMOVED_CONSOLE]
    }

    // Mark performance in browser timeline
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${componentName}-render-end`);
      if (isFirstRender.current) {
        performance.measure(
          `${componentName}-initial-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );
      }
    }

    isFirstRender.current = false;
  });

  // Mark the start of render
  if ('performance' in window && 'mark' in performance && isFirstRender.current) {
    performance.mark(`${componentName}-render-start`);
  }

  return {
    measureAction: (actionName: string, fn: () => void | Promise<void>) => {
      const startTime = performance.now();
      const result = fn();

      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - startTime;
          if (process.env.NODE_ENV === 'development') {
            // [REMOVED_CONSOLE]
          }
        });
      }

      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        // [REMOVED_CONSOLE]
      }
      return result;
    },
  };
}