CREATE TYPE "public"."permission_level" AS ENUM('view', 'edit');--> statement-breakpoint
CREATE TABLE "collaborators" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"user_id" text NOT NULL,
	"permission_level" "permission_level" DEFAULT 'view' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"invited_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"user_id" text NOT NULL,
	"note_id" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"color" text DEFAULT '#3B82F6',
	"recurrence_rule" jsonb,
	"recurrence_id" text,
	"reminder_minutes" integer,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "time_range_check" CHECK ("time_blocks"."end_time" > "time_blocks"."start_time")
);
--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "content" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "color" text DEFAULT '#6B7280';--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "icon" text DEFAULT 'folder';--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "path" text DEFAULT '/' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "last_accessed_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collaborators_note_user_unique" ON "collaborators" USING btree ("note_id","user_id");--> statement-breakpoint
CREATE INDEX "collaborators_note_id_idx" ON "collaborators" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "collaborators_user_id_idx" ON "collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "collaborators_accepted_at_idx" ON "collaborators" USING btree ("accepted_at");--> statement-breakpoint
CREATE INDEX "time_blocks_user_id_idx" ON "time_blocks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_blocks_note_id_idx" ON "time_blocks" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "time_blocks_start_time_idx" ON "time_blocks" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "time_blocks_end_time_idx" ON "time_blocks" USING btree ("end_time");--> statement-breakpoint
CREATE INDEX "time_blocks_user_id_time_range_idx" ON "time_blocks" USING btree ("user_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "time_blocks_recurrence_id_idx" ON "time_blocks" USING btree ("recurrence_id");--> statement-breakpoint
CREATE INDEX "folders_user_id_idx" ON "folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "folders_parent_id_idx" ON "folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "folders_path_idx" ON "folders" USING btree ("path");--> statement-breakpoint
CREATE INDEX "folders_user_id_parent_id_idx" ON "folders" USING btree ("user_id","parent_id");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_folder_id_idx" ON "notes" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "notes_user_id_folder_id_idx" ON "notes" USING btree ("user_id","folder_id");--> statement-breakpoint
CREATE INDEX "notes_updated_at_idx" ON "notes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "notes_last_accessed_at_idx" ON "notes" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE INDEX "notes_is_pinned_idx" ON "notes" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "notes_is_archived_idx" ON "notes" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "notes_is_trashed_idx" ON "notes" USING btree ("is_trashed");--> statement-breakpoint
CREATE INDEX "notes_deleted_at_idx" ON "notes" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "notes_content_gin_idx" ON "notes" USING gin ("content");