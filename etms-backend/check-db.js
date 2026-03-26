import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const pool = new pg.Pool({
  user: process.env.DB_USER || 'etms',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'etms',
  password: process.env.DB_PASSWORD || 'aaku28',
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function run() {
  const result = await pool.query("SELECT pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'users_role_check'");
  fs.writeFileSync('check_role_output.json', JSON.stringify(result.rows, null, 2), 'utf8');
  console.log('done');
  pool.end();
}
run();
