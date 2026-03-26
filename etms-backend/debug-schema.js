import pool from "./config/db.js";

async function checkFeedback() {
    try {
        const res = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'feedback'
    `);
        console.log("Feedback Columns:", res.rows);

        // Check if driver_id exists, if not add it
        const hasDriverId = res.rows.some(r => r.column_name === 'driver_id');
        if (!hasDriverId) {
            console.log("Adding driver_id to feedback table...");
            await pool.query('ALTER TABLE feedback ADD COLUMN driver_id INTEGER REFERENCES drivers(id)');
        }

        // Make message nullable if it's not
        const messageCol = res.rows.find(r => r.column_name === 'message');
        if (messageCol && messageCol.is_nullable === 'NO') {
            console.log("Making feedback.message nullable...");
            await pool.query('ALTER TABLE feedback ALTER COLUMN message DROP NOT NULL');
        }

        console.log("Feedback table schema verified/fixed.");
        process.exit(0);
    } catch (err) {
        console.error("Schema check failed:", err);
        process.exit(1);
    }
}

checkFeedback();
