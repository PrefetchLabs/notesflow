-- Rename verification_token to verification (if exists)
ALTER TABLE IF EXISTS "verification_token" RENAME TO "verification";

-- Add indexes to verification table
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");

-- Create folders table
CREATE TABLE IF NOT EXISTS "folders" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "parent_id" text,
  "user_id" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create notes table with soft delete support
CREATE TABLE IF NOT EXISTS "notes" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text DEFAULT 'Untitled Note' NOT NULL,
  "content" jsonb DEFAULT '{}' NOT NULL,
  "user_id" text NOT NULL,
  "folder_id" text,
  "tags" text[] DEFAULT '{}',
  "is_pinned" boolean DEFAULT false NOT NULL,
  "is_archived" boolean DEFAULT false NOT NULL,
  "is_trashed" boolean DEFAULT false NOT NULL,
  "deleted_at" timestamp,
  "last_edited_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notes" ADD CONSTRAINT "notes_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "notes" ADD CONSTRAINT "notes_last_edited_by_user_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "folders_user_id_idx" ON "folders"("user_id");
CREATE INDEX IF NOT EXISTS "folders_parent_id_idx" ON "folders"("parent_id");
CREATE INDEX IF NOT EXISTS "folders_position_idx" ON "folders"("position");
CREATE INDEX IF NOT EXISTS "notes_user_id_idx" ON "notes"("user_id");
CREATE INDEX IF NOT EXISTS "notes_folder_id_idx" ON "notes"("folder_id");
CREATE INDEX IF NOT EXISTS "notes_user_id_folder_id_idx" ON "notes"("user_id", "folder_id");
CREATE INDEX IF NOT EXISTS "notes_updated_at_idx" ON "notes"("updated_at");
CREATE INDEX IF NOT EXISTS "notes_is_pinned_idx" ON "notes"("is_pinned");
CREATE INDEX IF NOT EXISTS "notes_is_archived_idx" ON "notes"("is_archived");
CREATE INDEX IF NOT EXISTS "notes_is_trashed_idx" ON "notes"("is_trashed");
CREATE INDEX IF NOT EXISTS "notes_deleted_at_idx" ON "notes"("deleted_at");
CREATE INDEX IF NOT EXISTS "notes_content_gin_idx" ON "notes" USING gin("content");