import { pgTable, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';
import { folders } from './folders';

// Notes table with JSONB content for flexible rich text storage
export const notes = pgTable(
  'notes',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text('title').notNull().default('Untitled Note'),
    content: jsonb('content').notNull().default({}), // BlockNote JSON content
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    folderId: text('folder_id').references(() => folders.id, {
      onDelete: 'set null',
    }),
    tags: text('tags').array().default([]),
    isPinned: boolean('is_pinned').default(false).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    isTrashed: boolean('is_trashed').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
    lastEditedBy: text('last_edited_by').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for performance
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    folderIdIdx: index('notes_folder_id_idx').on(table.folderId),
    userIdFolderIdIdx: index('notes_user_id_folder_id_idx').on(
      table.userId,
      table.folderId
    ),
    updatedAtIdx: index('notes_updated_at_idx').on(table.updatedAt),
    isPinnedIdx: index('notes_is_pinned_idx').on(table.isPinned),
    isArchivedIdx: index('notes_is_archived_idx').on(table.isArchived),
    isTrashedIdx: index('notes_is_trashed_idx').on(table.isTrashed),
    deletedAtIdx: index('notes_deleted_at_idx').on(table.deletedAt),
    // GIN index for JSONB content search
    contentGinIdx: index('notes_content_gin_idx').using(
      'gin',
      table.content
    ),
  })
);

// Relations
export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
  folder: one(folders, {
    fields: [notes.folderId],
    references: [folders.id],
  }),
  lastEditor: one(user, {
    fields: [notes.lastEditedBy],
    references: [user.id],
    relationName: 'lastEditor',
  }),
  // TimeBlocks and Collaborators relations will be defined in their respective schema files
}));

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;