export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    console.log('[Instrumentation] Server started');
    
    // Track server startup time
    const startTime = performance.now();
    
    // You can add OpenTelemetry or other APM tools here
    // Example: await import('./instrumentation.node')
  }
  
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    console.log('[Instrumentation] Edge runtime started');
  }
}

export function onRequestError(
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  }
) {
  console.error('[Request Error]', {
    digest: error.digest,
    message: error.message,
    stack: error.stack,
    path: request.path,
    method: request.method,
    timestamp: new Date().toISOString(),
  });
  
  // Send to error tracking service if configured
  if (process.env.ERROR_TRACKING_ENDPOINT) {
    fetch(process.env.ERROR_TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          digest: error.digest,
          message: error.message,
          stack: error.stack,
        },
        request: {
          path: request.path,
          method: request.method,
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.error('[Error Tracking] Failed to send error:', err);
    });
  }
}