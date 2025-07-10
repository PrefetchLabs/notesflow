ALTER TABLE "subscriptions" ADD COLUMN "soft_limit_overages" jsonb DEFAULT '{"notesOverage":0,"foldersOverage":0,"aiCallsOverage":0}'::jsonb;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "is_new_user" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "new_user_grace_period_end" timestamp;