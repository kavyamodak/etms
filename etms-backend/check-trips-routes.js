import pool from './config/db.js';

async function check() {
    try {
        console.log("=== ALL TRIPS in DB ===");
        const trips = await pool.query(`
      SELECT t.id, t.start_location, t.end_location, t.status,
             eu.full_name as employee, du.full_name as driver,
             v.vehicle_number, v.make, v.model
      FROM trips t
      LEFT JOIN employees e ON t.employee_id = e.id
      LEFT JOIN users eu ON e.user_id = eu.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      ORDER BY t.id
    `);
        trips.rows.forEach(r => console.log(JSON.stringify(r)));

        console.log("\n=== ALL ROUTES in DB ===");
        const routes = await pool.query(`SELECT * FROM routes ORDER BY id`);
        routes.rows.forEach(r => console.log(JSON.stringify(r)));

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
check();
