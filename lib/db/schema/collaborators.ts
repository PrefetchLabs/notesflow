import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';
import { notes } from './notes';

// Permission levels for collaborators
export const permissionEnum = pgEnum('permission_level', ['view', 'edit']);

// Collaborators junction table for note sharing
export const collaborators = pgTable(
  'collaborators',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    permissionLevel: permissionEnum('permission_level')
      .notNull()
      .default('view'),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    acceptedAt: timestamp('accepted_at'),
    invitedBy: text('invited_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    // Ensure a user can only be invited once per note
    uniqueNoteUser: uniqueIndex('collaborators_note_user_unique').on(
      table.noteId,
      table.userId
    ),
    // Indexes for performance
    noteIdIdx: index('collaborators_note_id_idx').on(table.noteId),
    userIdIdx: index('collaborators_user_id_idx').on(table.userId),
    acceptedAtIdx: index('collaborators_accepted_at_idx').on(table.acceptedAt),
  })
);

// Relations
export const collaboratorsRelations = relations(collaborators, ({ one }) => ({
  note: one(notes, {
    fields: [collaborators.noteId],
    references: [notes.id],
  }),
  user: one(user, {
    fields: [collaborators.userId],
    references: [user.id],
  }),
  inviter: one(user, {
    fields: [collaborators.invitedBy],
    references: [user.id],
    relationName: 'invitedCollaborators',
  }),
}));

export type Collaborator = typeof collaborators.$inferSelect;
export type NewCollaborator = typeof collaborators.$inferInsert;