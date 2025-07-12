import { db } from './index';
import { sql } from 'drizzle-orm';

// Default query timeout in milliseconds
const DEFAULT_QUERY_TIMEOUT = 5000; // 5 seconds

/**
 * Executes a database query with a timeout
 * @param query - The query to execute
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Query result
 * @throws Error if query times out
 */
export async function executeWithTimeout<T>(
  query: Promise<T>,
  timeoutMs: number = DEFAULT_QUERY_TIMEOUT
): Promise<T> {
  // Create a timeout promise that rejects after the specified time
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Query timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  // Race between the query and the timeout
  try {
    const result = await Promise.race([query, timeoutPromise]);
    return result;
  } catch (error) {
    // If it's a timeout error, add more context
    if (error instanceof Error && error.message.includes('Query timeout')) {
      throw new Error(`Database query exceeded timeout of ${timeoutMs}ms. Consider optimizing the query or increasing the timeout.`);
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Executes a query within a transaction with statement timeout
 * @param callback - The transaction callback
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Transaction result
 */
export async function transactionWithTimeout<T>(
  callback: Parameters<typeof db.transaction>[0],
  timeoutMs: number = DEFAULT_QUERY_TIMEOUT
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set statement timeout for this transaction
    await tx.execute(sql`SET LOCAL statement_timeout = ${timeoutMs}`);
    return callback(tx);
  });
}

/**
 * Helper to add timeout to any Drizzle query builder
 * @param queryBuilder - The Drizzle query builder
 * @param timeoutMs - Timeout in milliseconds
 * @returns Query result with timeout
 */
export function withTimeout<T>(queryBuilder: Promise<T>, timeoutMs?: number): Promise<T> {
  return executeWithTimeout(queryBuilder, timeoutMs);
}

// Export common timeout values
export const QUERY_TIMEOUTS = {
  SHORT: 2000,     // 2 seconds - for simple queries
  DEFAULT: 5000,   // 5 seconds - for most queries
  LONG: 10000,     // 10 seconds - for complex queries
  REPORT: 30000,   // 30 seconds - for reporting queries
} as const;