import pool from '../config/db.js';

async function migrate() {
    console.log("🚀 Starting database migration for Google Maps integration...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add columns to trips table
        console.log("Checking trips table...");
        await client.query(`
            ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS expected_completion_time TIMESTAMP,
            ADD COLUMN IF NOT EXISTS total_distance DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS total_duration INTEGER,
            ADD COLUMN IF NOT EXISTS otp VARCHAR(10);
        `);

        // 2. Add columns to routes table
        console.log("Checking routes table...");
        await client.query(`
            ALTER TABLE routes 
            ADD COLUMN IF NOT EXISTS polyline TEXT;
        `);

        // 3. Ensure driver_locations table has trip_id
        console.log("Checking driver_locations table...");
        await client.query(`
            ALTER TABLE driver_locations 
            ADD COLUMN IF NOT EXISTS trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE;
        `);

        await client.query('COMMIT');
        console.log("✅ Migration completed successfully!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Migration failed:", err.message);
    } finally {
        client.release();
    }
}

export default migrate;

if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
    migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
