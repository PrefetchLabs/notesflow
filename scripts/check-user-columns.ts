import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkUserColumns() {
  try {
    // Query to get column information from PostgreSQL
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      ORDER BY ordinal_position
    `);
    
    console.log('User table columns:');
    console.log('==================');
    result.rows.forEach((row: any) => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (error) {
    console.error('Error checking columns:', error);
  }
  process.exit(0);
}

checkUserColumns();