ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled_reason" text;