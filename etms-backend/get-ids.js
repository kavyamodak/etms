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

async function getIds() {
    try {
        const res = await pool.query("SELECT id, full_name, role FROM users WHERE role = 'employee' LIMIT 5");
        console.log('--- EMPLOYEES ---');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err.message);
    } finally {
        await pool.end();
    }
}
getIds();
