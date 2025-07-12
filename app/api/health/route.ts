import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';
import { headers } from 'next/headers';
import os from 'os';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    auth: {
      status: 'up' | 'down';
      provider: string;
    };
    storage: {
      status: 'up' | 'down';
      provider: string;
    };
  };
  system?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      loadAverage: number[];
    };
    node: {
      version: string;
    };
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Check for monitoring header (for detailed system info)
  const headersList = await headers();
  const monitoringKey = headersList.get('x-monitoring-key');
  const isInternalMonitoring = monitoringKey === process.env.MONITORING_KEY;
  
  // Initialize response
  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: 'down' },
      auth: { status: 'up', provider: 'BetterAuth' },
      storage: { status: 'up', provider: 'Supabase' },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    const dbCheck = await checkDatabaseConnection();
    const dbResponseTime = Date.now() - dbStart;
    
    if (dbCheck.connected) {
      response.services.database = {
        status: 'up',
        responseTime: dbResponseTime,
      };
    } else {
      response.services.database = {
        status: 'down',
        error: 'Connection failed',
      };
      response.status = 'degraded';
    }
  } catch (error) {
    response.services.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    response.status = 'unhealthy';
  }

  // Check auth service (basic check - could be enhanced)
  try {
    // In a real scenario, you might want to verify auth service is responding
    // For now, we assume it's up if environment variables are set
    if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) {
      response.services.auth.status = 'down';
      response.status = 'degraded';
    }
  } catch (error) {
    response.services.auth.status = 'down';
    response.status = 'degraded';
  }

  // Check storage service
  try {
    // Basic check for Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      response.services.storage.status = 'down';
      response.status = 'degraded';
    }
  } catch (error) {
    response.services.storage.status = 'down';
    response.status = 'degraded';
  }

  // Add system information for internal monitoring
  if (isInternalMonitoring) {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    response.system = {
      memory: {
        used: Math.round(usedMem / 1024 / 1024), // MB
        total: Math.round(totalMem / 1024 / 1024), // MB
        percentage: Math.round((usedMem / totalMem) * 100),
      },
      cpu: {
        loadAverage: os.loadavg(),
      },
      node: {
        version: process.version,
      },
    };
  }

  // Determine HTTP status code based on health status
  let statusCode = 200;
  if (response.status === 'degraded') {
    statusCode = 200; // Still return 200 for degraded to not trigger alarms
  } else if (response.status === 'unhealthy') {
    statusCode = 503; // Service unavailable
  }

  // Add response headers
  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}

// Lightweight health check for load balancers
export async function HEAD() {
  try {
    // Quick database ping
    const dbCheck = await checkDatabaseConnection();
    
    if (dbCheck.connected) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}