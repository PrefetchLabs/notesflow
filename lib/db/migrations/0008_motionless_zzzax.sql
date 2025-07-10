CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'pro_monthly', 'pro_yearly', 'early_bird');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_invoice_id" text,
	"stripe_payment_intent_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"description" text,
	"invoice_url" text,
	"hosted_invoice_url" text,
	"pdf_url" text,
	"metadata" jsonb,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_history_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"user_agent" text,
	"screen_resolution" text,
	"timezone" text,
	"language" text,
	"platform" text,
	"name" text,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"blocked_at" timestamp,
	"blocked_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"limits" jsonb DEFAULT '{"maxNotes":10,"maxFolders":3,"maxDevices":1,"maxAiCalls":0,"maxCollaborators":0,"maxStorage":100}'::jsonb,
	"usage" jsonb DEFAULT '{"notesCount":0,"foldersCount":0,"devicesCount":0,"aiCallsCount":0,"collaboratorsCount":0,"storageUsed":0}'::jsonb,
	"grace_period_end" timestamp,
	"is_in_grace_period" boolean DEFAULT false,
	"is_early_bird" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;