import { NextResponse } from 'next/server';

/**
 * Liveness probe endpoint
 * Used by Kubernetes/container orchestrators to determine if the app is alive
 * This should be lightweight and not depend on external services
 */
export async function GET() {
  // Simple check - if this endpoint responds, the app is alive
  return NextResponse.json(
    {
      alive: true,
      timestamp: new Date().toISOString(),
      pid: process.pid,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

// Even lighter weight HEAD request for high-frequency checks
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}