import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema/auth';
import { subscriptions } from '@/lib/db/schema/subscriptions';
import { addDays } from 'date-fns';

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
      // Add any custom user fields here if needed
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
  hooks: {
    after: [
      {
        filter: ['user.create'],
        handler: async ({ context }) => {
          const user = context.user;
          if (user?.id) {
            try {
              // Create a free subscription for new users with 7-day grace period
              const now = new Date();
              const gracePeriodEnd = addDays(now, 7);
              
              await db.insert(subscriptions).values({
                id: crypto.randomUUID(),
                userId: user.id,
                plan: 'free',
                status: 'active',
                isNewUser: true,
                newUserGracePeriodEnd: gracePeriodEnd,
                createdAt: now,
                updatedAt: now,
              });
              
              console.log(`Created free subscription for new user: ${user.id}`);
            } catch (error) {
              console.error('Failed to create subscription for new user:', error);
              // Don't fail the signup if subscription creation fails
            }
          }
        },
      },
    ],
  },
});