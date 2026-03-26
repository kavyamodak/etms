import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER || 'etms',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'etms',
    password: process.env.DB_PASSWORD || 'aaku28',
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function migrate() {
    try {
        console.log('Adding sequence_number to trips table...');
        await pool.query(`
            ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS sequence_number INTEGER DEFAULT 0;
        `);
        console.log('Migration successful: sequence_number added.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
