/**
 * DB Migration: Smart Route System
 * =================================
 * Adds columns required for the route-matching flow:
 *   routes.max_passengers      - max employees this route/vehicle can carry
 *   routes.waypoints           - JSON array of intermediate stops
 *   routes.start_lat / start_lng - geocoded start (filled by Google Maps later)
 *   routes.end_lat   / end_lng   - geocoded end
 *
 * Safe to run multiple times (uses IF NOT EXISTS pattern).
 */

import pool from './config/db.js';

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Running route-system migration...');

        // 1. Add max_passengers to routes (how many employees the vehicle can take)
        await client.query(`
      ALTER TABLE routes
      ADD COLUMN IF NOT EXISTS max_passengers INTEGER DEFAULT 10
    `);
        console.log('  ✅ routes.max_passengers');

        // 2. Add waypoints (JSON array of intermediate stop addresses)
        await client.query(`
      ALTER TABLE routes
      ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]'::jsonb
    `);
        console.log('  ✅ routes.waypoints');

        // 3. Add geocoded coordinates for start/end (populated by Google Maps on creation)
        await client.query(`
      ALTER TABLE routes
      ADD COLUMN IF NOT EXISTS start_lat DECIMAL(10,8),
      ADD COLUMN IF NOT EXISTS start_lng DECIMAL(11,8),
      ADD COLUMN IF NOT EXISTS end_lat   DECIMAL(10,8),
      ADD COLUMN IF NOT EXISTS end_lng   DECIMAL(11,8)
    `);
        console.log('  ✅ routes.start_lat / start_lng / end_lat / end_lng');

        // 4. Add geocoded coordinates to trips for employee pickup point
        await client.query(`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS pickup_lat  DECIMAL(10,8),
      ADD COLUMN IF NOT EXISTS pickup_lng  DECIMAL(11,8),
      ADD COLUMN IF NOT EXISTS dropoff_lat DECIMAL(10,8),
      ADD COLUMN IF NOT EXISTS dropoff_lng DECIMAL(11,8)
    `);
        console.log('  ✅ trips.pickup_lat / pickup_lng / dropoff_lat / dropoff_lng');

        // 5. Add match_method column to trips so we know how the route was assigned
        await client.query(`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS match_method VARCHAR(50) DEFAULT 'manual'
    `);
        console.log('  ✅ trips.match_method (manual | text_fallback | google_maps | new_route)');

        // 6. Ensure trips has route_id (it should already per schema)
        await client.query(`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS route_id INTEGER REFERENCES routes(id)
    `);
        console.log('  ✅ trips.route_id (FK to routes)');

        await client.query('COMMIT');
        console.log('\n✅ Migration complete.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
