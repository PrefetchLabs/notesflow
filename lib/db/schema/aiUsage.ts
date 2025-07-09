import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const aiUsage = pgTable('ai_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  tokensUsed: integer('tokens_used').notNull().default(0),
  commandType: text('command_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull().defaultNow(), // Will be set properly in migration
});

export type AIUsage = typeof aiUsage.$inferSelect;
export type NewAIUsage = typeof aiUsage.$inferInsert;