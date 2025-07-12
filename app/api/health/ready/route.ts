import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Readiness probe endpoint
 * Used by Kubernetes/container orchestrators to determine if the app is ready to receive traffic
 */
export async function GET() {
  const checks = {
    database: false,
    migrations: false,
    environment: false,
  };

  try {
    // Check database connection and basic query
    const result = await db.execute(sql`SELECT 1 as healthy`);
    checks.database = result.length > 0;

    // Check if migrations have been run (check if critical tables exist)
    try {
      await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'user'
        ) AND EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'notes'
        ) as tables_exist
      `);
      checks.migrations = true;
    } catch {
      checks.migrations = false;
    }

    // Check critical environment variables
    checks.environment = !!(
      process.env.DATABASE_URL &&
      process.env.BETTER_AUTH_SECRET &&
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );

    // All checks must pass for readiness
    const isReady = Object.values(checks).every(check => check === true);

    return NextResponse.json(
      {
        ready: isReady,
        checks,
        timestamp: new Date().toISOString(),
      },
      { 
        status: isReady ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        checks,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}