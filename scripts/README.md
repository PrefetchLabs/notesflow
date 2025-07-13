# NotesFlow Database Setup Scripts

This directory contains SQL scripts to set up a fresh NotesFlow database in a new Supabase instance.

## Scripts Overview

### Core Setup Scripts (Required)

1. **`setup-database.sql`** - Creates all tables, enums, indexes, and constraints
2. **`setup-storage.sql`** - Configures storage buckets and RLS policies for file uploads
3. **`setup-realtime.sql`** - Enables realtime functionality for the time_blocks table

### Optional Scripts

4. **`setup-extensions.sql`** - Installs required PostgreSQL extensions (usually pre-installed by Supabase)
5. **`setup-rls-policies.sql`** - Adds Row Level Security policies for additional security
6. **`setup-all.sql`** - Master script that runs all scripts in order (for psql command line)

## Installation Instructions

### Method 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run each script in this order:
   - `setup-database.sql`
   - `setup-storage.sql`
   - `setup-realtime.sql`
   - (Optional) `setup-rls-policies.sql`

### Method 2: psql Command Line

```bash
# Set your database connection
export DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

# Run all scripts
psql $DATABASE_URL -f setup-all.sql

# Or run individually
psql $DATABASE_URL -f setup-database.sql
psql $DATABASE_URL -f setup-storage.sql
psql $DATABASE_URL -f setup-realtime.sql
```

### Method 3: Using Supabase CLI

```bash
# Run scripts using Supabase CLI
supabase db reset --db-url $DATABASE_URL
supabase db push --db-url $DATABASE_URL setup-database.sql
supabase db push --db-url $DATABASE_URL setup-storage.sql
supabase db push --db-url $DATABASE_URL setup-realtime.sql
```

## Post-Installation Steps

1. **Verify Installation**
   - Check that all tables are created in the public schema
   - Verify the `notes-assets` storage bucket exists
   - Confirm realtime is enabled for `time_blocks` table

2. **Configure Application**
   - Update your `.env` file with Supabase credentials
   - Set up Drizzle ORM connection
   - Test database connectivity

3. **Optional Configuration**
   - Enable realtime for additional tables (edit `setup-realtime.sql`)
   - Add RLS policies for enhanced security (run `setup-rls-policies.sql`)
   - Configure additional storage buckets if needed

## Important Notes

- **Extensions**: Supabase usually pre-installs required extensions. Run `setup-extensions.sql` only if you get extension-related errors.
- **RLS Policies**: The main scripts enable RLS but don't create policies. The application handles authorization at the API level. Run `setup-rls-policies.sql` for database-level security.
- **Realtime**: Only `time_blocks` table has realtime enabled by default. Enable for other tables as needed.
- **Storage**: Only `notes-assets` bucket is created. Add an `avatars` bucket if user profile images are needed.

## Troubleshooting

### Common Issues

1. **Extension not found**: Run `setup-extensions.sql` first
2. **Permission denied**: Ensure you're using the postgres user or have sufficient privileges
3. **Storage schema missing**: Ensure Supabase Storage is enabled in your project
4. **Realtime not working**: Check that Realtime is enabled in your Supabase project settings

### Verification Queries

```sql
-- Check all tables are created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

## Script Modifications

These scripts are generated from a production database dump and match the exact schema. Modifications should be made carefully:

- **Adding tables**: Update `setup-database.sql` and follow the existing patterns
- **Adding indexes**: Consider performance impact and add to appropriate section
- **Changing types**: Ensure compatibility with existing data and application code
- **Adding RLS policies**: Test thoroughly as they can block legitimate access

## Support

For issues or questions:
1. Check the Supabase documentation
2. Review the application's Drizzle schema files
3. Consult the original database dump for reference