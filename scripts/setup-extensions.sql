-- NotesFlow Extensions Setup Script
-- Run this BEFORE setup-database.sql to ensure all required extensions are installed
-- Note: Some of these may already be enabled by Supabase by default

-- Create necessary schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS vault;

-- Core extensions required by the application
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Additional extensions that Supabase typically includes
-- These are optional but recommended
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA graphql;
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA vault;

-- Auth helper functions that are commonly used
-- These are typically created by Supabase automatically
-- but included here for completeness

-- Get current user ID
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
  CASE 
    WHEN current_setting('request.jwt.claim.sub', true) IS NULL THEN NULL
    ELSE (current_setting('request.jwt.claim.sub', true))::uuid 
  END
$$;

-- Get current user email
CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
  CASE 
    WHEN current_setting('request.jwt.claim.email', true) IS NULL THEN NULL
    ELSE current_setting('request.jwt.claim.email', true)
  END
$$;

-- Get current user role
CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
  CASE 
    WHEN current_setting('request.jwt.claim.role', true) IS NULL THEN NULL
    ELSE current_setting('request.jwt.claim.role', true)
  END
$$;

-- Get full JWT claims
CREATE OR REPLACE FUNCTION auth.jwt() 
RETURNS jsonb 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
  CASE 
    WHEN current_setting('request.jwt.claims', true) IS NULL THEN NULL
    ELSE (current_setting('request.jwt.claims', true))::jsonb
  END
$$;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Grant execute on auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.email() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;