import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './auth';
import { notes } from './notes';

// Time blocks table for calendar scheduling
export const timeBlocks = pgTable(
  'time_blocks',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    noteId: text('note_id').references(() => notes.id, {
      onDelete: 'set null',
    }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    color: text('color').default('#3B82F6'), // Default blue color
    type: text('type', { enum: ['event', 'task'] }).default('event').notNull(),
    recurrenceRule: jsonb('recurrence_rule'), // RRULE format for recurring events
    recurrenceId: text('recurrence_id'), // Parent ID for recurring instances
    reminderMinutes: integer('reminder_minutes'), // Minutes before event to remind
    isCompleted: boolean('is_completed').default(false).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Check constraint to ensure end time is after start time
    timeRangeCheck: check(
      'time_range_check',
      sql`${table.endTime} > ${table.startTime}`
    ),
    // Indexes for performance
    userIdIdx: index('time_blocks_user_id_idx').on(table.userId),
    noteIdIdx: index('time_blocks_note_id_idx').on(table.noteId),
    startTimeIdx: index('time_blocks_start_time_idx').on(table.startTime),
    endTimeIdx: index('time_blocks_end_time_idx').on(table.endTime),
    // Composite index for time range queries
    userIdTimeRangeIdx: index('time_blocks_user_id_time_range_idx').on(
      table.userId,
      table.startTime,
      table.endTime
    ),
    recurrenceIdIdx: index('time_blocks_recurrence_id_idx').on(
      table.recurrenceId
    ),
  })
);

// Relations
export const timeBlocksRelations = relations(timeBlocks, ({ one }) => ({
  user: one(user, {
    fields: [timeBlocks.userId],
    references: [user.id],
  }),
  note: one(notes, {
    fields: [timeBlocks.noteId],
    references: [notes.id],
  }),
  parentRecurrence: one(timeBlocks, {
    fields: [timeBlocks.recurrenceId],
    references: [timeBlocks.id],
    relationName: 'recurrenceParent',
  }),
}));

export type TimeBlock = typeof timeBlocks.$inferSelect;
export type NewTimeBlock = typeof timeBlocks.$inferInsert;