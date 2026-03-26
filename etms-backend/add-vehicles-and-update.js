import pool from './config/db.js';

async function run() {
  try {
    console.log("=== Step 1: Setting all inactive drivers to active ===");
    const updated = await pool.query("UPDATE drivers SET status = 'active' WHERE status = 'inactive' RETURNING id, status");
    console.log(`Updated ${updated.rowCount} drivers to active.`);

    console.log("\n=== Step 2: Inserting new vehicles ===");
    await pool.query(`
      INSERT INTO vehicles (vehicle_number, vehicle_type, make, model, capacity, status)
      VALUES 
        ('DL01RN9001', 'Sedan',      'Honda',   'City',       4, 'active'),
        ('DL02RN9002', 'SUV',        'Ford',     'Endeavour',  7, 'active'),
        ('DL03RN9003', 'MiniVan',    'Kia',      'Carnival',   8, 'active')
      ON CONFLICT (vehicle_number) DO NOTHING;
    `);
    console.log("Vehicles inserted (or already exist).");

    console.log("\n=== Step 3: Fetching the new vehicles and unassigned drivers ===");
    const newVehicles = await pool.query(`
      SELECT id, vehicle_number FROM vehicles 
      WHERE vehicle_number IN ('DL01RN9001', 'DL02RN9002', 'DL03RN9003')
      ORDER BY id
    `);

    // Find drivers that don't currently have a vehicle assigned to them
    const freeDrivers = await pool.query(`
      SELECT d.id, u.full_name FROM drivers d
      JOIN users u ON u.id = d.user_id
      WHERE d.vehicle_id IS NULL OR d.vehicle_id NOT IN (
        SELECT id FROM vehicles WHERE vehicle_number IN ('DL01RN9001', 'DL02RN9002', 'DL03RN9003')
      )
      ORDER BY d.id
      LIMIT 3
    `);

    console.log(`Found ${newVehicles.rows.length} new vehicles and ${freeDrivers.rows.length} available drivers.`);

    console.log("\n=== Step 4: Assigning vehicles to existing drivers ===");
    const assignCount = Math.min(newVehicles.rows.length, freeDrivers.rows.length);
    for (let i = 0; i < assignCount; i++) {
      const vehicle = newVehicles.rows[i];
      const driver = freeDrivers.rows[i];

      // Link vehicle → driver
      await pool.query(
        `UPDATE vehicles SET current_driver_id = $1 WHERE id = $2`,
        [driver.id, vehicle.id]
      );
      // Link driver → vehicle
      await pool.query(
        `UPDATE drivers SET vehicle_id = $1 WHERE id = $2`,
        [vehicle.id, driver.id]
      );

      console.log(`  ✅ Vehicle ${vehicle.vehicle_number} assigned to driver: ${driver.full_name} (driver id: ${driver.id})`);
    }

    console.log("\n=== Done! ===");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
