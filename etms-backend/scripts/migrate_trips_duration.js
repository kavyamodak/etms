import pool from '../config/db.js';

async function migrate() {
    try {
        console.log("Adding expected_completion_time to trips table...");
        await pool.query(`
            ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS expected_completion_time TIMESTAMP;
        `);
        console.log("Migration successful.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
