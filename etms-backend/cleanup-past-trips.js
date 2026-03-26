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
        const tripRes = await pool.query(`
      UPDATE trips 
      SET status = 'completed', actual_end_time = CURRENT_TIMESTAMP
      WHERE status IN ('scheduled', 'in_progress') AND scheduled_time < CURRENT_TIMESTAMP;
    `);

        const routeRes = await pool.query(`
      UPDATE routes
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE status IN ('active', 'planned')
        AND id IN (
          SELECT r.id FROM routes r
          JOIN trips t ON t.route_id = r.id
          GROUP BY r.id
          HAVING COUNT(t.id) > 0 
             AND COUNT(CASE WHEN t.status IN ('scheduled', 'in_progress', 'active') THEN 1 END) = 0
        );
    `);

        console.log(`🤖 Auto-completed ${tripRes.rowCount} past trips and ${routeRes.rowCount} stale routes.`);
        pool.end();
    } catch (err) {
        console.error("Cleanup error:", err);
        pool.end();
    }
}

run();
