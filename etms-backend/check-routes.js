import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    database: process.env.DB_NAME,
    port: 5432
});

async function run() {
    try {
        const res = await pool.query(`SELECT * FROM routes ORDER BY id DESC LIMIT 5;`);
        console.log(res.rows);
        pool.end();
    } catch (e) { console.error(e); pool.end(); }
}
run();
