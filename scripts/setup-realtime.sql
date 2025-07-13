-- NotesFlow Realtime Configuration Script
-- Run this script AFTER running setup-database.sql and setup-storage.sql
-- This enables realtime functionality for specific tables

-- Check if supabase_realtime publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    RAISE EXCEPTION 'supabase_realtime publication does not exist. Please ensure Supabase Realtime is enabled.';
  END IF;
END $$;

-- Enable realtime for time_blocks table
-- This is used for real-time calendar updates
ALTER PUBLICATION supabase_realtime ADD TABLE time_blocks;

-- Optional: Enable realtime for other tables
-- Uncomment the lines below to enable realtime for additional tables

-- Enable realtime for notes table (useful for collaborative editing)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notes;

-- Enable realtime for collaborators table (useful for sharing notifications)
-- ALTER PUBLICATION supabase_realtime ADD TABLE collaborators;

-- Enable realtime for folders table (useful for folder structure updates)
-- ALTER PUBLICATION supabase_realtime ADD TABLE folders;

-- Verify realtime is enabled for time_blocks
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public'
      AND tablename = 'time_blocks'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Success: Realtime enabled for time_blocks table';
  ELSE
    RAISE WARNING 'Warning: Failed to enable realtime for time_blocks table';
  END IF;
END $$;

-- Note: After enabling realtime for tables, you may need to:
-- 1. Restart the Supabase Realtime service (in self-hosted setups)
-- 2. Configure RLS policies for realtime access
-- 3. Set up client-side subscriptions in your application

-- Example RLS policies for realtime (if not already set):
-- These ensure users can only receive realtime updates for their own data

-- Example for time_blocks:
-- CREATE POLICY "Users can receive realtime updates for their own time blocks"
-- ON time_blocks
-- FOR SELECT
-- USING (auth.uid()::text = user_id);

-- Example for notes (if enabled):
-- CREATE POLICY "Users can receive realtime updates for their own notes"
-- ON notes
-- FOR SELECT
-- USING (
--   auth.uid()::text = user_id 
--   OR EXISTS (
--     SELECT 1 FROM collaborators 
--     WHERE collaborators.note_id = notes.id 
--       AND collaborators.user_id = auth.uid()::text
--       AND collaborators.accepted_at IS NOT NULL
--   )
-- );