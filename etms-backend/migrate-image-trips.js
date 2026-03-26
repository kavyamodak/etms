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
        await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_image TEXT;`);
        console.log("Added vehicle_image to vehicles table.");

        const result = await pool.query(`
      UPDATE trips 
      SET status = 'completed', actual_end_time = CURRENT_TIMESTAMP
      WHERE status = 'scheduled' AND scheduled_time < CURRENT_TIMESTAMP;
    `);
        console.log(`Updated ${result.rowCount} past scheduled trips to completed.`);

        // Also let's set any past `in_progress` to completed just to be safe
        const result2 = await pool.query(`
      UPDATE trips 
      SET status = 'completed', actual_end_time = CURRENT_TIMESTAMP
      WHERE status = 'in_progress' AND scheduled_time < CURRENT_TIMESTAMP - INTERVAL '1 day';
    `);

        pool.end();
    } catch (err) {
        console.error("Migration error:", err);
        pool.end();
    }
}

run();
