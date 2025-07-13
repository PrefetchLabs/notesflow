import { pgTable, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

// Subscription status enum
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused'
]);

// Subscription plan enum
export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'free',
  'beta',
  'pro_monthly',
  'pro_yearly',
  'early_bird'
]);

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  
  // Stripe fields
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  
  // Subscription details
  plan: subscriptionPlanEnum('plan').default('free').notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  
  // Billing period
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAt: timestamp('cancel_at'),
  canceledAt: timestamp('canceled_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  
  // Trial information
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  
  // Usage limits and tracking
  limits: jsonb('limits').$type<{
    maxNotes: number;
    maxFolders: number;
    maxAiCalls: number;
    maxCollaborators: number;
    maxStorage: number; // in MB
  }>().default({
    maxNotes: 10,
    maxFolders: 3,
    maxAiCalls: 10,
    maxCollaborators: 0,
    maxStorage: 100
  }),
  
  // Current usage
  usage: jsonb('usage').$type<{
    notesCount: number;
    foldersCount: number;
    aiCallsCount: number;
    collaboratorsCount: number;
    storageUsed: number; // in MB
  }>().default({
    notesCount: 0,
    foldersCount: 0,
    aiCallsCount: 0,
    collaboratorsCount: 0,
    storageUsed: 0
  }),
  
  // Grace period tracking
  gracePeriodEnd: timestamp('grace_period_end'),
  isInGracePeriod: boolean('is_in_grace_period').default(false),
  
  // Soft limit overage tracking (10% over limits)
  softLimitOverages: jsonb('soft_limit_overages').$type<{
    notesOverage: number;
    foldersOverage: number;
    aiCallsOverage: number;
  }>().default({
    notesOverage: 0,
    foldersOverage: 0,
    aiCallsOverage: 0
  }),
  
  // New user grace period (7 days of full features)
  isNewUser: boolean('is_new_user').default(true),
  newUserGracePeriodEnd: timestamp('new_user_grace_period_end'),
  
  // Early bird special
  isEarlyBird: boolean('is_early_bird').default(false),
  
  // Additional metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Device tracking table
export const devices = pgTable('devices', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  
  // Device fingerprint components
  fingerprint: text('fingerprint').notNull(),
  userAgent: text('user_agent'),
  screenResolution: text('screen_resolution'),
  timezone: text('timezone'),
  language: text('language'),
  platform: text('platform'),
  
  // Device metadata
  name: text('name'), // User-friendly name like "John's MacBook"
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  blockedAt: timestamp('blocked_at'),
  blockedReason: text('blocked_reason'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Billing history table
export const billingHistory = pgTable('billing_history', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  
  // Stripe data
  stripeInvoiceId: text('stripe_invoice_id').unique(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  
  // Transaction details
  amount: integer('amount').notNull(), // in cents
  currency: text('currency').default('usd').notNull(),
  status: text('status').notNull(), // paid, pending, failed
  description: text('description'),
  
  // Invoice data
  invoiceUrl: text('invoice_url'),
  hostedInvoiceUrl: text('hosted_invoice_url'),
  pdfUrl: text('pdf_url'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
  devices: many(devices),
  billingHistory: many(billingHistory),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  user: one(user, {
    fields: [devices.userId],
    references: [user.id],
  }),
  subscription: one(subscriptions, {
    fields: [devices.userId],
    references: [subscriptions.userId],
  }),
}));

export const billingHistoryRelations = relations(billingHistory, ({ one }) => ({
  user: one(user, {
    fields: [billingHistory.userId],
    references: [user.id],
  }),
  subscription: one(subscriptions, {
    fields: [billingHistory.userId],
    references: [subscriptions.userId],
  }),
}));

// Type exports
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type NewBillingHistory = typeof billingHistory.$inferInsert;