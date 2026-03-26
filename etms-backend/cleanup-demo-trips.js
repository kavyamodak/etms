import pool from './config/db.js';

async function cleanup() {
    try {
        console.log("=== Removing demo trips (employee='car', Demo Hub location) ===");

        // Delete trips where the employee user is named 'car' (the demo placeholder)
        const deleted = await pool.query(`
      DELETE FROM trips
      WHERE id IN (
        SELECT t.id FROM trips t
        LEFT JOIN employees e ON t.employee_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        WHERE LOWER(u.full_name) = 'car'
           OR t.start_location = 'Demo Hub'
      )
      RETURNING id, start_location, end_location
    `);

        console.log(`Deleted ${deleted.rowCount} demo trips:`);
        deleted.rows.forEach(r => console.log(`  - Trip #${r.id}: ${r.start_location} → ${r.end_location}`));

        console.log("\n=== Freeing up drivers who were marked inactive due to demo trips ===");
        // Re-activate any driver that no longer has an active trip
        const freed = await pool.query(`
      UPDATE drivers
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'inactive'
        AND NOT EXISTS (
          SELECT 1 FROM trips t
          WHERE t.driver_id = drivers.id
            AND t.status IN ('scheduled', 'in_progress')
        )
      RETURNING id
    `);
        console.log(`Freed ${freed.rowCount} drivers back to active.`);

        console.log("\n=== Removing demo 'car' user and related employee record ===");
        // Also clean up the 'car' user if it exists (demo placeholder account)
        const carUser = await pool.query(`SELECT id FROM users WHERE LOWER(full_name) = 'car'`);
        if (carUser.rows.length > 0) {
            await pool.query(`DELETE FROM employees WHERE user_id = $1`, [carUser.rows[0].id]);
            await pool.query(`DELETE FROM users WHERE id = $1`, [carUser.rows[0].id]);
            console.log("Removed 'car' demo user.");
        } else {
            console.log("No 'car' demo user found.");
        }

        console.log("\n=== Done! ===");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

cleanup();
