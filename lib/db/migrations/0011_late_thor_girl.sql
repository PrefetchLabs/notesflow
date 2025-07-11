ALTER TYPE "public"."subscription_plan" ADD VALUE 'beta' BEFORE 'pro_monthly';--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"user_id" text NOT NULL,
	"onboarding_completed" boolean DEFAULT false,
	"onboarding_completed_at" timestamp,
	"theme" text DEFAULT 'system',
	"sidebar_collapsed" boolean DEFAULT false,
	"default_view" text DEFAULT 'dashboard',
	"editor_font_size" text DEFAULT 'medium',
	"editor_line_height" text DEFAULT 'normal',
	"show_word_count" boolean DEFAULT true,
	"auto_save_enabled" boolean DEFAULT true,
	"auto_save_interval" text DEFAULT '2000',
	"week_starts_on" text DEFAULT 'sunday',
	"default_calendar_view" text DEFAULT 'week',
	"working_hours_start" text DEFAULT '09:00',
	"working_hours_end" text DEFAULT '17:00',
	"email_notifications" boolean DEFAULT true,
	"reminder_notifications" boolean DEFAULT true,
	"collaboration_notifications" boolean DEFAULT true,
	"preferred_language" text DEFAULT 'en',
	"timezone" text DEFAULT 'UTC',
	"custom_settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "metadata" jsonb;