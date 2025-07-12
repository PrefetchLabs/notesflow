import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Singleton pattern for Next.js
const globalForDb = global as unknown as {
  queryClient: ReturnType<typeof postgres> | undefined;
};

// Create the connection with optimized pooling settings
const queryClient =
  globalForDb.queryClient ??
  postgres(connectionString, {
    // Connection pool configuration
    max: 10, // Maximum number of connections in pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    
    // Query configuration
    prepare: true, // Use prepared statements for better performance
    
    // Query timeout configuration
    timeout: 5, // Default query timeout in seconds
    idle_timeout: 20, // Close idle connections after 20 seconds
    
    // Connection retry configuration
    max_lifetime: 60 * 30, // 30 minutes
    
    // Error handling
    onnotice: () => {}, // Suppress notices in production
    
    // Transform configuration
    transform: {
      undefined: null, // Transform undefined to null
    },
  });

// Prevent multiple connections in development
if (process.env.NODE_ENV !== 'production') {
  globalForDb.queryClient = queryClient;
}

// Create Drizzle instance with logging in development
export const db = drizzle(queryClient, {
  logger: process.env.NODE_ENV === 'development',
});

// For migrations (single connection)
export const migrationClient = postgres(connectionString, { 
  max: 1,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

// Health check function
export async function checkDatabaseConnection() {
  try {
    await queryClient`SELECT 1`;
    return { connected: true };
  } catch (error) {
    // [REMOVED_CONSOLE]
    return { connected: false, error };
  }
}

// Graceful shutdown - only in Node.js runtime
if (typeof process !== 'undefined' && process.on && process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    await queryClient.end();
    process.exit(0);
  });
}