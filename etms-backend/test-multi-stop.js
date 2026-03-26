import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER || 'etms',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'etms',
    password: process.env.DB_PASSWORD || 'aaku28',
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function testFlow() {
    console.log('--- STARTING MULTI-STOP FLOW TEST ---');
    try {
        const routeName = 'Verification Route ' + Date.now();
        console.log(`[Step 1/3] Creating route: ${routeName}`);
        const routeRes = await pool.query(
            "INSERT INTO routes (route_name, start_location, end_location, status) VALUES ($1, 'A', 'B', 'planned') RETURNING id",
            [routeName]
        );
        const routeId = routeRes.rows[0].id;

        console.log(`[Step 2/3] Adding 2 trips to route ${routeId}...`);
        await pool.query(
            "INSERT INTO trips (employee_id, route_id, start_location, end_location, scheduled_time, status, otp, sequence_number) VALUES ($1, $2, $3, $4, NOW(), 'scheduled', $5, $6)",
            [1, routeId, 'Stop 1', 'Drop', '1111', 1]
        );
        await pool.query(
            "INSERT INTO trips (employee_id, route_id, start_location, end_location, scheduled_time, status, otp, sequence_number) VALUES ($1, $2, $3, $4, NOW(), 'scheduled', $5, $6)",
            [2, routeId, 'Stop 2', 'Drop', '2222', 2]
        );

        console.log(`[Step 3/3] Verifying data...`);
        const res = await pool.query("SELECT * FROM trips WHERE route_id = $1 ORDER BY sequence_number", [routeId]);
        
        console.log('--- RESULTS ---');
        res.rows.forEach(t => {
            console.log(`Trip ID ${t.id} | Stop ${t.sequence_number} | Employee ${t.employee_id} | OTP ${t.otp}`);
        });

        if (res.rows.length === 2 && res.rows[0].sequence_number === 1 && res.rows[1].sequence_number === 2) {
            console.log('SUCCESS: Sequence preserved and records created correctly.');
        } else {
            console.error('FAILURE: Data mismatch.');
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
        console.log('--- TEST COMPLETE ---');
    }
}

testFlow();
