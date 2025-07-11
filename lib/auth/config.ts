import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema/auth';

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  secret: process.env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: false, // We're only using Google OAuth for now
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
      },
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    },
  },
  advanced: {
    database: {
      generateId: () => {
        // Use a more secure ID generation method
        return crypto.randomUUID();
      },
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
  plugins: [
    nextCookies(), // This must be the last plugin
  ],
});