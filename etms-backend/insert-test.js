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

async function run() {
    try {
        const result = await pool.query(
            `INSERT INTO users (full_name, email, role, password_hash)
       VALUES ($1, $2, 'employee', 'GOOGLE_AUTH')
       RETURNING *`,
            ['Test User', `test-user-${Date.now()}@example.com`]
        );
        console.log('Inserted:', result.rows[0]);
    } catch (err) {
        console.error('Failed to insert user:', err.message);
    } finally {
        pool.end();
    }
}
run();
