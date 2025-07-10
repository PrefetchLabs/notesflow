import { pgTable, text, timestamp, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  category: varchar('category', { length: 50 }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value').notNull(),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    categoryKeyIdx: uniqueIndex('category_key_idx').on(table.category, table.key),
  };
});