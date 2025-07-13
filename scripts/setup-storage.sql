-- NotesFlow Storage Setup Script
-- This script creates storage buckets and RLS policies for Supabase Storage
-- Run this script in your Supabase SQL editor after running setup-database.sql

-- Note: The storage schema and tables are usually created by Supabase automatically
-- This script assumes they exist and only creates buckets and policies

-- Check if storage schema exists and has the required tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    RAISE EXCEPTION 'Storage schema does not exist. Please ensure Supabase Storage is enabled.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    RAISE EXCEPTION 'Storage buckets table does not exist. Please ensure Supabase Storage is enabled.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    RAISE EXCEPTION 'Storage objects table does not exist. Please ensure Supabase Storage is enabled.';
  END IF;
END $$;

-- Create notes-assets bucket for note images and attachments
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'notes-assets',
  'notes-assets',
  true, -- Public bucket for easy access to images
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

-- Note: Avatars bucket is not created in the dump
-- Add it here if you need it in the future

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to ensure clean state)
DROP POLICY IF EXISTS "Authenticated users can upload images 20250112" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images 20250112" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images 20250112" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images 20250112" ON storage.objects;

-- Create RLS policies for notes-assets bucket
-- Policy: Authenticated users can upload images (matching dump)
CREATE POLICY "Authenticated users can upload images 20250112"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes-assets'::text);

-- Policy: Anyone can view images (matching dump)
CREATE POLICY "Anyone can view images 20250112"
ON storage.objects
FOR SELECT
USING (bucket_id = 'notes-assets'::text);

-- Policy: Users can update their own images (matching dump)
CREATE POLICY "Users can update their own images 20250112"
ON storage.objects
FOR UPDATE
TO authenticated
USING ((bucket_id = 'notes-assets'::text) AND ((auth.uid())::text = (owner)::text));

-- Policy: Users can delete their own images (matching dump)
CREATE POLICY "Users can delete their own images 20250112"
ON storage.objects
FOR DELETE
TO authenticated
USING ((bucket_id = 'notes-assets'::text) AND ((auth.uid())::text = (owner)::text));

-- Note: Avatars bucket policies are not included since the bucket doesn't exist in the dump
-- Add them if you create the avatars bucket

-- Note: Storage indexes and triggers are managed by Supabase
-- The dump shows these indexes exist:
-- - bucketid_objname (unique index on bucket_id, name)
-- - idx_objects_bucket_id_name
-- - name_prefix_search
-- These are created automatically by Supabase

-- Grant necessary permissions (matching dump)
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;

-- Enable RLS on storage tables (matching dump)
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verification query to check bucket creation
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'notes-assets') INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE 'Success: notes-assets bucket exists';
  ELSE
    RAISE WARNING 'Warning: notes-assets bucket was not created';
  END IF;
END $$;