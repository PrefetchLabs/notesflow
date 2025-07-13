-- NotesFlow Database Setup Script
-- This script creates all tables, indexes, and constraints for a fresh Supabase instance
-- 
-- IMPORTANT: Run scripts in this order:
-- 1. setup-extensions.sql (optional - Supabase usually has these)
-- 2. setup-database.sql (this file)
-- 3. setup-storage.sql
-- 4. setup-realtime.sql
-- 5. setup-rls-policies.sql (optional - for additional security)

-- Enable required extensions (if not already done in setup-extensions.sql)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS ai_usage CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS billing_history CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS collaborators CASCADE;
DROP TABLE IF EXISTS time_blocks CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS permission_level CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;

-- Create enums
CREATE TYPE user_role AS ENUM ('user', 'admin', 'system_admin');
CREATE TYPE permission_level AS ENUM ('view', 'edit', 'admin');
CREATE TYPE subscription_status AS ENUM (
  'active', 'canceled', 'past_due', 'trialing', 
  'incomplete', 'incomplete_expired', 'unpaid', 'paused'
);
CREATE TYPE subscription_plan AS ENUM (
  'free', 'beta', 'pro_monthly', 'pro_yearly', 'early_bird'
);

-- Create user table
CREATE TABLE "user" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  name TEXT,
  image TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  admin_permissions JSONB DEFAULT '[]'::JSONB,
  last_admin_activity_at TIMESTAMP WITHOUT TIME ZONE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  disabled_at TIMESTAMP WITHOUT TIME ZONE,
  disabled_reason TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create session table
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create account table (OAuth providers)
CREATE TABLE account (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMP WITHOUT TIME ZONE,
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (provider_id, account_id)
);

-- Create verification table
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create folders table
CREATE TABLE folders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'folder',
  position INTEGER NOT NULL DEFAULT 0,
  path TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create notes table
CREATE TABLE notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content JSONB NOT NULL DEFAULT '{}'::JSONB,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  is_trashed BOOLEAN DEFAULT false NOT NULL,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,
  last_edited_by TEXT REFERENCES "user"(id),
  last_accessed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create time_blocks table
CREATE TABLE time_blocks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  note_id TEXT REFERENCES notes(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  type TEXT NOT NULL DEFAULT 'event' CHECK (type IN ('event', 'task')),
  recurrence_rule JSONB,
  recurrence_id TEXT,
  reminder_minutes INTEGER,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT time_range_check CHECK (end_time > start_time)
);

-- Create collaborators table
CREATE TABLE collaborators (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  permission_level permission_level NOT NULL DEFAULT 'view',
  invited_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMP WITHOUT TIME ZONE,
  invited_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan subscription_plan DEFAULT 'free' NOT NULL,
  status subscription_status DEFAULT 'active' NOT NULL,
  current_period_start TIMESTAMP WITHOUT TIME ZONE,
  current_period_end TIMESTAMP WITHOUT TIME ZONE,
  cancel_at TIMESTAMP WITHOUT TIME ZONE,
  canceled_at TIMESTAMP WITHOUT TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_start TIMESTAMP WITHOUT TIME ZONE,
  trial_end TIMESTAMP WITHOUT TIME ZONE,
  limits JSONB DEFAULT '{"maxNotes": 10, "maxFolders": 3, "maxAiCalls": 0, "maxCollaborators": 0, "maxStorage": 100}'::JSONB,
  usage JSONB DEFAULT '{"notesCount": 0, "foldersCount": 0, "aiCallsCount": 0, "collaboratorsCount": 0, "storageUsed": 0}'::JSONB,
  grace_period_end TIMESTAMP WITHOUT TIME ZONE,
  is_in_grace_period BOOLEAN DEFAULT false,
  soft_limit_overages JSONB DEFAULT '{"notesOverage": 0, "foldersOverage": 0, "aiCallsOverage": 0}'::JSONB,
  is_new_user BOOLEAN DEFAULT true,
  new_user_grace_period_end TIMESTAMP WITHOUT TIME ZONE,
  is_early_bird BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create devices table
CREATE TABLE devices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  platform TEXT,
  name TEXT,
  last_active_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  blocked_at TIMESTAMP WITHOUT TIME ZONE,
  blocked_reason TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create billing_history table
CREATE TABLE billing_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd' NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  invoice_url TEXT,
  hosted_invoice_url TEXT,
  pdf_url TEXT,
  metadata JSONB,
  paid_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL UNIQUE,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITHOUT TIME ZONE,
  theme TEXT DEFAULT 'system',
  sidebar_collapsed BOOLEAN DEFAULT false,
  default_view TEXT DEFAULT 'dashboard',
  editor_font_size TEXT DEFAULT 'medium',
  editor_line_height TEXT DEFAULT 'normal',
  show_word_count BOOLEAN DEFAULT true,
  auto_save_enabled BOOLEAN DEFAULT true,
  auto_save_interval TEXT DEFAULT '2000',
  week_starts_on TEXT DEFAULT 'sunday',
  default_calendar_view TEXT DEFAULT 'week',
  working_hours_start TEXT DEFAULT '09:00',
  working_hours_end TEXT DEFAULT '17:00',
  email_notifications BOOLEAN DEFAULT true,
  reminder_notifications BOOLEAN DEFAULT true,
  collaboration_notifications BOOLEAN DEFAULT true,
  preferred_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  custom_settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create ai_usage table
CREATE TABLE ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  command_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create system_settings table
CREATE TABLE system_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
-- User indexes (none needed - email already has unique constraint)

-- Session indexes (none needed - token already has unique constraint)

-- Account indexes (none needed - user_id foreign key automatically indexed)

-- Verification indexes (none needed in dump)

-- Folders indexes
CREATE INDEX folders_user_id_idx ON folders(user_id);
CREATE INDEX folders_parent_id_idx ON folders(parent_id);
CREATE INDEX folders_path_idx ON folders(path);
CREATE INDEX folders_user_id_parent_id_idx ON folders(user_id, parent_id);

-- Notes indexes
CREATE INDEX notes_user_id_idx ON notes(user_id);
CREATE INDEX notes_folder_id_idx ON notes(folder_id);
CREATE INDEX notes_user_id_folder_id_idx ON notes(user_id, folder_id);
CREATE INDEX notes_updated_at_idx ON notes(updated_at);
CREATE INDEX notes_last_accessed_at_idx ON notes(last_accessed_at);
CREATE INDEX notes_is_pinned_idx ON notes(is_pinned);
CREATE INDEX notes_is_archived_idx ON notes(is_archived);
CREATE INDEX notes_is_trashed_idx ON notes(is_trashed);
CREATE INDEX notes_deleted_at_idx ON notes(deleted_at);
-- GIN index for JSONB content search
CREATE INDEX notes_content_gin_idx ON notes USING gin(content);

-- Time blocks indexes
CREATE INDEX time_blocks_user_id_idx ON time_blocks(user_id);
CREATE INDEX time_blocks_note_id_idx ON time_blocks(note_id);
CREATE INDEX time_blocks_start_time_idx ON time_blocks(start_time);
CREATE INDEX time_blocks_end_time_idx ON time_blocks(end_time);
CREATE INDEX time_blocks_user_id_time_range_idx ON time_blocks(user_id, start_time, end_time);
CREATE INDEX time_blocks_recurrence_id_idx ON time_blocks(recurrence_id);

-- Collaborators indexes
CREATE UNIQUE INDEX collaborators_note_user_unique ON collaborators(note_id, user_id);
CREATE INDEX collaborators_note_id_idx ON collaborators(note_id);
CREATE INDEX collaborators_user_id_idx ON collaborators(user_id);
CREATE INDEX collaborators_accepted_at_idx ON collaborators(accepted_at);

-- Subscriptions indexes (none needed - unique constraints already in place)

-- Devices indexes (none needed)

-- Billing history indexes (none needed - unique constraint on stripe_invoice_id)

-- User preferences indexes (none needed - unique constraint on user_id)

-- AI usage indexes (none needed)

-- System settings indexes
CREATE UNIQUE INDEX category_key_idx ON system_settings(category, key);

-- Note: Updated_at triggers are not in the dump, so they're not included here
-- You may want to add them separately if needed

-- Enable Row Level Security on all tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Note: AI usage reset trigger is not in the dump, so it's not included here
-- The reset_at column has a default value instead

-- Insert default system settings
INSERT INTO system_settings (category, key, value) VALUES
  ('maintenance', 'mode', 'false'),
  ('features', 'ai_enabled', 'true'),
  ('features', 'collaboration_enabled', 'true'),
  ('limits', 'max_file_size_mb', '10'),
  ('limits', 'max_note_size_mb', '5')
ON CONFLICT (category, key) DO NOTHING;

-- Note: Default subscription trigger is not in the dump
-- Subscriptions and user preferences should be created by the application logic

COMMENT ON TABLE "user" IS 'User accounts with authentication and authorization';
COMMENT ON TABLE session IS 'Active user sessions';
COMMENT ON TABLE account IS 'OAuth provider accounts linked to users';
COMMENT ON TABLE verification IS 'Email verification and magic link tokens';
COMMENT ON TABLE folders IS 'Hierarchical folder structure for organizing notes';
COMMENT ON TABLE notes IS 'User notes with rich text content stored as JSONB';
COMMENT ON TABLE time_blocks IS 'Calendar events and tasks with time scheduling';
COMMENT ON TABLE collaborators IS 'Note sharing and collaboration permissions';
COMMENT ON TABLE subscriptions IS 'User subscription plans and usage tracking';
COMMENT ON TABLE devices IS 'Device fingerprinting and tracking';
COMMENT ON TABLE billing_history IS 'Stripe payment and invoice records';
COMMENT ON TABLE user_preferences IS 'User UI/UX preferences and settings';
COMMENT ON TABLE ai_usage IS 'AI feature usage tracking with monthly resets';
COMMENT ON TABLE system_settings IS 'System-wide configuration key-value store';

-- Realtime Configuration
-- Note: Supabase automatically creates the realtime schema and publication
-- You need to manually enable realtime for specific tables in the Supabase dashboard
-- or by running these commands after the database is set up:

-- Enable realtime for time_blocks table (based on migration file)
-- ALTER PUBLICATION supabase_realtime ADD TABLE time_blocks;

-- To enable realtime for other tables, use:
-- ALTER PUBLICATION supabase_realtime ADD TABLE table_name;

-- Common tables to consider for realtime:
-- - notes (for collaborative editing)
-- - time_blocks (for calendar updates)
-- - collaborators (for sharing notifications)