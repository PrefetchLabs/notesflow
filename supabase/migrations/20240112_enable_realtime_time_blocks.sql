-- Enable realtime for time_blocks table
ALTER PUBLICATION supabase_realtime ADD TABLE time_blocks;

-- Verify realtime is enabled
SELECT 
  schemaname,
  tablename 
FROM 
  pg_publication_tables 
WHERE 
  pubname = 'supabase_realtime' AND 
  tablename = 'time_blocks';