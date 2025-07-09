import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

// Folders table with self-referential relationships for hierarchy
export const folders = pgTable(
  'folders',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references((): any => folders.id, {
      onDelete: 'cascade',
    }),
    color: text('color').default('#6B7280'), // Default gray color
    icon: text('icon').default('folder'), // Default folder icon
    position: integer('position').notNull().default(0),
    path: text('path').notNull().default('/'), // Materialized path for efficient queries
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for performance
    userIdIdx: index('folders_user_id_idx').on(table.userId),
    parentIdIdx: index('folders_parent_id_idx').on(table.parentId),
    pathIdx: index('folders_path_idx').on(table.path),
    userIdParentIdIdx: index('folders_user_id_parent_id_idx').on(
      table.userId,
      table.parentId
    ),
  })
);

// Relations
export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: 'parentFolder',
  }),
  children: many(folders, {
    relationName: 'parentFolder',
  }),
  // Notes relation will be defined in the notes schema file
}));

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;