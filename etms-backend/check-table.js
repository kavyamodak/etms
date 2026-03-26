import { Pool } from 'pg';

const pool = new Pool({
  user: 'etms',
  host: 'localhost',
  database: 'etms',
  password: 'aaku28',
  port: 5432,
});

async function checkTableStructure() {
  try {
    const result = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'feedback' 
      ORDER BY ordinal_position
    `);
    
    console.log('Feedback table structure:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
