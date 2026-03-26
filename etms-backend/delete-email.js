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
        const res = await pool.query("DELETE FROM users WHERE email = 'modakkavya12@gmail.com'");
        console.log(`Deleted ${res.rowCount} row(s)`);
    } catch (err) {
        console.log(err.message);
    } finally {
        pool.end();
    }
}
run();
