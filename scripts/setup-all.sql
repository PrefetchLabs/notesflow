-- NotesFlow Complete Setup Script
-- This script references all setup scripts in the correct order
-- Run this in your Supabase SQL editor to set up everything at once

-- IMPORTANT: This assumes all script files are available
-- If running via Supabase dashboard, you may need to run each script separately

\echo 'Starting NotesFlow database setup...'

-- 1. Extensions (optional - Supabase usually has these)
-- \i setup-extensions.sql
\echo 'Skipping extensions setup (usually pre-installed by Supabase)'

-- 2. Main database structure
\echo 'Creating database tables and structure...'
\i setup-database.sql

-- 3. Storage configuration  
\echo 'Setting up storage buckets and policies...'
\i setup-storage.sql

-- 4. Realtime configuration
\echo 'Configuring realtime for time_blocks table...'
\i setup-realtime.sql

-- 5. RLS Policies (optional - uncomment if you want additional security)
-- \echo 'Setting up Row Level Security policies...'
-- \i setup-rls-policies.sql

\echo 'NotesFlow database setup complete!'
\echo ''
\echo 'Next steps:'
\echo '1. Update your .env file with the database connection details'
\echo '2. Run any pending Drizzle migrations if needed'
\echo '3. Test the connection from your application'
\echo ''
\echo 'Optional:'
\echo '- Enable RLS policies by running setup-rls-policies.sql'
\echo '- Enable realtime for additional tables in setup-realtime.sql'