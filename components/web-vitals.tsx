'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useEffect, useState } from 'react';

type MetricRating = 'good' | 'needs-improvement' | 'poor';

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: MetricRating;
  navigationType?: string;
}

// Thresholds for Core Web Vitals
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

export function WebVitals() {
  const [metrics, setMetrics] = useState<Record<string, WebVitalsMetric>>({});
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled via query parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const debugEnabled =
      urlParams.get('debug') === 'true' ||
      localStorage.getItem('webVitalsDebug') === 'true';
    setIsDebugMode(debugEnabled);
  }, []);

  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      // [REMOVED_CONSOLE]
    }

    // Update metrics state for debug display
    setMetrics((prev) => ({
      ...prev,
      [metric.name]: {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: metric.rating || getRating(metric.name, metric.value),
        navigationType: metric.navigationType,
      },
    }));

    // Send to analytics endpoint (if configured)
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      const body = JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });

      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, body);
      } else {
        fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          body,
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch((error) => {
          // [REMOVED_CONSOLE]
        });
      }
    }
  });

  // Helper function to determine rating based on thresholds
  function getRating(name: string, value: number): MetricRating {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Debug overlay for development
  if (!isDebugMode || Object.keys(metrics).length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border bg-white p-4 shadow-lg">
      <h3 className="mb-2 text-sm font-semibold">Core Web Vitals</h3>
      <div className="space-y-1 text-xs">
        {Object.entries(metrics).map(([name, metric]) => (
          <div key={name} className="flex items-center justify-between gap-4">
            <span>{name}:</span>
            <span
              className={`font-mono ${
                metric.rating === 'good'
                  ? 'text-green-600'
                  : metric.rating === 'needs-improvement'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {name === 'CLS'
                ? metric.value.toFixed(3)
                : `${Math.round(metric.value)}ms`}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          localStorage.removeItem('webVitalsDebug');
          setIsDebugMode(false);
        }}
        className="mt-2 text-xs text-gray-500 hover:text-gray-700"
      >
        Close
      </button>
    </div>
  );
}