import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ user: process.env.DB_USER || 'etms', password: process.env.DB_PASSWORD || 'aaku28', host: 'localhost', database: 'etms', port: 5432 });

const r = await pool.query(`
  SELECT 
    d.id AS driver_id, 
    d.user_id, 
    d.vehicle_id, 
    d.license_number, 
    d.status, 
    d.rating,
    u.full_name, 
    u.email, 
    v.id AS v_id, 
    v.vehicle_number, 
    v.vehicle_type, 
    v.model, 
    v.capacity,
    v.current_driver_id
  FROM drivers d 
  JOIN users u ON d.user_id = u.id 
  LEFT JOIN vehicles v ON d.vehicle_id = v.id 
  WHERE u.email = 'khansuyash@gmail.com'
`);

console.log('=== DRIVER + VEHICLE FOR SUYASH ===');
if (r.rows.length === 0) {
    console.log('No driver record found for khansuyash@gmail.com');
    // Show all users to check
    const users = await pool.query('SELECT id, email, full_name, role FROM users ORDER BY created_at DESC LIMIT 10');
    console.log('All users:', users.rows.map(u => `${u.id}: ${u.email} (${u.role})`).join('\n'));
} else {
    console.log(JSON.stringify(r.rows[0], null, 2));

    const driver = r.rows[0];
    if (!driver.vehicle_id) {
        console.log('\n⚠️  PROBLEM: driver.vehicle_id is NULL — vehicle is NOT linked to this driver!');
        console.log('The onboarding form ran but did not link the vehicle properly.');

        // Show all vehicles
        const v = await pool.query('SELECT id, vehicle_number, vehicle_type, model, current_driver_id FROM vehicles ORDER BY created_at DESC LIMIT 10');
        console.log('\nAll vehicles in DB:');
        console.log(JSON.stringify(v.rows, null, 2));
    } else {
        console.log('\n✅ Vehicle IS linked to driver');
    }
}

await pool.end();
