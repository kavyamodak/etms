import express from 'express';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendTripOTPEmail } from '../utils/email.js';

dotenv.config();

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    console.log("❌ No token provided in Authorization header");
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided',
      error: 'Authorization header required in format: Bearer <token>'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    console.log("✅ JWT token verified for user:", decoded.id);
    next();
  } catch (error) {
    console.log("❌ JWT token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
      error: error.message
    });
  }
};

// ==================== ONBOARDING ====================
router.post('/onboarding/employee', verifyToken, async (req, res) => {
  const { employeeId, employeeName, phone, department, projectCode, address, pickupPoint } = req.body;

  if (!employeeId || !employeeName || !phone) {
    return res.status(400).json({ error: 'employeeId, employeeName, and phone are required' });
  }

  try {
    await pool.query(
      `UPDATE users
       SET full_name = $2,
           phone = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.user.id, employeeName, phone]
    );

    const composedLocation = `Address: ${address || ''}; Pickup: ${pickupPoint || ''}`;

    let employeeResult = await pool.query(
      `UPDATE employees
       SET employee_id = $2,
           department = COALESCE($3, department),
           designation = COALESCE($4, designation),
           location = COALESCE($5, location),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [req.user.id, employeeId, department || null, projectCode || null, composedLocation]
    );

    if (employeeResult.rows.length === 0) {
      // Missing employee record (e.g. Google OAuth signups), let's create it
      employeeResult = await pool.query(
        `INSERT INTO employees (user_id, employee_id, department, designation, location)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.id, employeeId, department || null, projectCode || null, composedLocation]
      );
    }

    return res.json({
      message: 'Employee onboarding saved',
      full_name: employeeName,
      phone,
      employee: employeeResult.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==================== PROFILE ====================
router.get('/profile/me', verifyToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT id, full_name, email, phone, role
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.role === 'employee') {
      const employeeResult = await pool.query(
        `SELECT e.*
         FROM employees e
         WHERE e.user_id = $1`,
        [req.user.id]
      );
      return res.json({ user, employee: employeeResult.rows[0] || null });
    }

    if (user.role === 'driver') {
      const driverResult = await pool.query(
        `SELECT d.*, v.vehicle_number, v.vehicle_type, v.model, v.capacity
         FROM drivers d
         LEFT JOIN vehicles v ON v.id = d.vehicle_id
         WHERE d.user_id = $1`,
        [req.user.id]
      );
      return res.json({ user, driver: driverResult.rows[0] || null });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==================== TRIPS ====================
/**
 * Employee trip request — smart route matching flow:
 * 1. Fetch all active routes with capacity info
 * 2. Match request to closest route (Google Maps if key present, else text-similarity)
 * 3a. If match found AND vehicle has room → add employee to that route's trip
 * 3b. If no match → auto-assign available driver + vehicle → create new route + trip
 */
router.post('/trips', verifyToken, async (req, res) => {
  console.log("🚀 POST /trips hit! Body:", JSON.stringify(req.body));
  const { start_location, end_location, scheduled_time } = req.body;
  if (!start_location || !scheduled_time) {
    return res.status(400).json({ error: 'start_location and scheduled_time are required' });
  }

  try {
    // Identify requesting employee
    const empResult = await pool.query(
      `SELECT id FROM employees WHERE user_id = $1`,
      [req.user.id]
    );
    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee record not found for this user' });
    }
    const employee_id = empResult.rows[0].id;

    // 1. Load all active routes with vehicle capacity
    const routesResult = await pool.query(`
      SELECT r.*,
             v.capacity AS vehicle_capacity,
             v.id       AS vid,
             d.id       AS did,
             d.status   AS driver_status
      FROM routes r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN drivers  d ON r.assigned_driver_id = d.id
      WHERE r.status IN ('planned', 'active')
      ORDER BY r.created_at DESC
    `);
    const activeRoutes = routesResult.rows;

    // 2. Count current passengers per route (scheduled/in_progress trips)
    const passengerCounts = {};
    if (activeRoutes.length > 0) {
      const countResult = await pool.query(`
        SELECT route_id, COUNT(*) AS cnt
        FROM trips
        WHERE route_id IS NOT NULL
          AND status IN ('scheduled', 'in_progress')
        GROUP BY route_id
      `);
      countResult.rows.forEach(row => {
        passengerCounts[row.route_id] = parseInt(row.cnt);
      });
    }

    // 3. Match using routeMatcher service
    const { findBestRouteWithMaps, findBestRoute, mapsEnabled } = await import('../services/routeMatcher.js');

    // Parse waypoints for all active routes if they are strings
    const processedRoutes = activeRoutes.map(r => ({
      ...r,
      waypoints: typeof r.waypoints === 'string' ? JSON.parse(r.waypoints) : (r.waypoints || [])
    }));

    let matchResult;
    if (mapsEnabled) {
      matchResult = await findBestRouteWithMaps({
        startLocation: start_location,
        endLocation: end_location || start_location,
        scheduledTime: scheduled_time,
        activeRoutes: processedRoutes,
        vehicleCapacities: passengerCounts,
      });
    } else {
      matchResult = findBestRoute({
        startLocation: start_location,
        endLocation: end_location || start_location,
        scheduledTime: scheduled_time,
        activeRoutes: processedRoutes,
        vehicleCapacities: passengerCounts,
      });
    }

    let driver_id, vehicle_id, route_id, matchMethod;

    if (matchResult.matchType === 'existing' && matchResult.route) {
      const route = matchResult.route;
      driver_id = route.did;
      vehicle_id = route.vid;
      route_id = route.id;
      matchMethod = mapsEnabled ? 'google_maps' : 'text_fallback';

      if (route.status === 'planned') {
        await pool.query(
          `UPDATE routes SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [route_id]
        );
      }
    } else {
      const availDriver = await pool.query(`
        SELECT d.id AS driver_id, d.vehicle_id
        FROM drivers d
        WHERE d.status = 'active'
          AND d.vehicle_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM trips t
            WHERE t.driver_id = d.id AND t.status IN ('scheduled','in_progress')
          )
        LIMIT 1
      `);

      if (availDriver.rows.length === 0) {
        return res.status(503).json({
          error: 'No available drivers at the moment. Please try again later.',
          matchType: 'no_driver',
        });
      }

      driver_id = availDriver.rows[0].driver_id;
      vehicle_id = availDriver.rows[0].vehicle_id;
      matchMethod = 'new_route';
      const routeName = `${start_location} → ${end_location || start_location}`;

      // --- Google Maps Polyline ---
      const { getDirections } = await import('../services/googleMaps.js');
      let polyline = '';
      try {
          const directions = await getDirections(start_location, end_location || start_location);
          polyline = directions.polyline;
      } catch (e) {
          console.warn("Directions API failed during route creation:", e.message);
      }

      const newRoute = await pool.query(`
        INSERT INTO routes
          (route_name, start_location, end_location, assigned_driver_id, vehicle_id, status, polyline, max_passengers)
        VALUES ($1, $2, $3, $4, $5, 'active', $6, COALESCE(
          (SELECT capacity FROM vehicles WHERE id = $5), 10
        ))
        RETURNING *
      `, [routeName, start_location, end_location || start_location, driver_id, vehicle_id, polyline]);

      route_id = newRoute.rows[0].id;
    }

    // --- Google Maps Distance/Duration ---
    let durationSeconds = 600; // 10 min fallback
    let distanceMeters = 0;
    try {
        const distData = await getDistanceMatrix(start_location, end_location || start_location);
        durationSeconds = distData.durationSeconds;
        distanceMeters = distData.distanceMeters;
    } catch (e) {
        console.warn("Distance Matrix failed during trip creation, using fallback", e.message);
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`\n[OTP] TRIP START: ${otp} for Route ${route_id}\n`);

    // 4. Create the trip (Immediately 'in_progress')
    const tripResult = await pool.query(`
      INSERT INTO trips
        (employee_id, driver_id, vehicle_id, route_id,
         start_location, end_location, scheduled_time, actual_start_time,
         expected_completion_time, total_duration, total_distance,
         status, match_method, created_at, otp)
      VALUES ($1::integer, $2::integer, $3::integer, $4::integer, $5, $6, $7::timestamp, NOW(), 
              NOW() + ($9::text || ' seconds')::INTERVAL, $9::integer, $10::numeric,
              'in_progress', $8, NOW(), $11)
      RETURNING *
    `, [
      employee_id, driver_id, vehicle_id, route_id,
      start_location, end_location || start_location,
      scheduled_time, matchMethod, durationSeconds, distanceMeters, otp
    ]);

    // 5. Mark driver inactive (on trip)
    if (driver_id) {
      await pool.query(
        `UPDATE drivers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [driver_id]
      );
    }

    return res.json({
      message: 'Trip requested',
      trip: tripResult.rows[0],
      matchType: matchResult.matchType,
      matchMethod,
      routeId: route_id,
    });
  } catch (err) {
    console.error('Trip request error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN ROUTES ====================
router.post('/admin/routes', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create routes' });
  }

  const { vehicle_number, driver_id, start_location, end_location, scheduled_time, employee_ids } = req.body;

  if (!vehicle_number || !driver_id || !start_location || !end_location || !scheduled_time || !employee_ids || !employee_ids.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find vehicle id from number
    const vehicleRes = await client.query('SELECT id, capacity FROM vehicles WHERE vehicle_number = $1', [vehicle_number]);
    if (vehicleRes.rows.length === 0) throw new Error('Vehicle not found');
    const vehicle_id = vehicleRes.rows[0].id;
    const capacity = vehicleRes.rows[0].capacity;

    if (employee_ids.length > capacity) {
        throw new Error('Number of employees exceeds vehicle capacity');
    }

    // --- Google Maps Polyline & Waypoints ---
    const { getDirections } = await import('../services/googleMaps.js');
    let polyline = '';
    try {
        // Fetch all employee pickup locations to use as waypoints (optional but better)
        // For now, just generate the main route.
        const directions = await getDirections(start_location, end_location);
        polyline = directions.polyline;
    } catch (e) {
        console.warn("Admin Directions API failed:", e.message);
    }

    // Create route
    const routeName = `${start_location} → ${end_location}`;
    const routeRes = await client.query(`
      INSERT INTO routes
        (route_name, start_location, end_location, assigned_driver_id, vehicle_id, status, polyline)
      VALUES ($1, $2, $3, $4, $5, 'active', $6)
      RETURNING *
    `, [routeName, start_location, end_location, driver_id, vehicle_id, polyline]);
    
    const route_id = routeRes.rows[0].id;

    // Fetch distance/duration from Google Maps
    const { getDistanceMatrix } = await import('../services/googleMaps.js');
    let durationSeconds = 600;
    let distanceMeters = 0;
    try {
        const distData = await getDistanceMatrix(start_location, end_location);
        durationSeconds = distData.durationSeconds;
        distanceMeters = distData.distanceMeters;
    } catch (e) {
        console.warn("Admin route creation: Distance Matrix failed", e.message);
    }

    // Create trips for each employee
    const trips = [];
    for (const emp_id of employee_ids) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log(`\n[OTP] Admin Trip OTP for Employee ${emp_id}: ${otp}\n`);
      const tripRes = await client.query(`
        INSERT INTO trips
          (employee_id, driver_id, vehicle_id, route_id,
           start_location, end_location, scheduled_time, actual_start_time,
           expected_completion_time, total_duration, total_distance,
           status, match_method, created_at, otp)
        VALUES ($1::integer, $2::integer, $3::integer, $4::integer, $5, $6, $7::timestamp, NOW(), 
                NOW() + ($8::text || ' seconds')::INTERVAL, $8::integer, $9::numeric,
                'in_progress', 'admin_assigned', CURRENT_TIMESTAMP, $10)
        RETURNING *
      `, [
        emp_id, driver_id, vehicle_id, route_id,
        start_location, end_location,
        scheduled_time, durationSeconds, distanceMeters, otp
      ]);
      trips.push(tripRes.rows[0]);
    }
    
    // Mark driver as busy
    await client.query(
        `UPDATE drivers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [driver_id]
    );
      
    await client.query('COMMIT');
    return res.json({ message: 'Route and trips created successfully. Trips are now in-progress.', route: routeRes.rows[0], trips });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Admin route creation error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


router.get('/trips', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         t.id,
         t.route_id,
         r.route_name,
         t.start_location,
         t.end_location,
         t.scheduled_time,
         t.actual_start_time,
         t.actual_end_time,
         t.status,
         u.full_name AS employee_name,
         u.email AS employee_email,
         du.full_name AS driver_name,
         v.vehicle_number,
         v.vehicle_type,
         v.model
       FROM trips t
       JOIN employees e ON e.id = t.employee_id
       JOIN users u ON u.id = e.user_id
       LEFT JOIN drivers d ON d.id = t.driver_id
       LEFT JOIN users du ON du.id = d.user_id
       LEFT JOIN vehicles v ON v.id = t.vehicle_id
       LEFT JOIN routes r ON r.id = t.route_id
       ORDER BY t.created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/trips/my-trips', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = '';
    let params = [userId];

    if (userRole === 'driver') {
      query = `
        SELECT 
          t.id, t.start_location, t.end_location, t.scheduled_time,
          t.actual_start_time, t.actual_end_time, t.status,
          v.vehicle_number, v.vehicle_type, v.model,
          r.route_name,
          u.full_name as passenger_name,
          u.phone as passenger_phone
        FROM trips t
        JOIN drivers d ON d.id = t.driver_id
        JOIN employees e ON e.id = t.employee_id
        JOIN users u ON u.id = e.user_id
        LEFT JOIN routes r ON r.id = t.route_id
        LEFT JOIN vehicles v ON v.id = t.vehicle_id
        WHERE d.user_id = $1
        ORDER BY t.created_at DESC`;
    } else {
      query = `
        SELECT 
          t.id, t.start_location, t.end_location, t.scheduled_time,
          t.actual_start_time, t.actual_end_time, t.status,
          v.vehicle_number, v.vehicle_type, v.model,
          r.route_name,
          du.full_name as driver_name,
          du.phone as driver_phone,
          u.full_name as employee_name
        FROM trips t
        JOIN employees e ON e.id = t.employee_id
        JOIN users u ON u.id = e.user_id
        LEFT JOIN routes r ON r.id = t.route_id
        LEFT JOIN drivers d ON d.id = t.driver_id
        LEFT JOIN users du ON du.id = d.user_id
        LEFT JOIN vehicles v ON v.id = t.vehicle_id
        WHERE e.user_id = $1
        ORDER BY t.created_at DESC`;
    }

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('Trips GET error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /trips/:id
router.get('/trips/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         t.*,
         u.full_name AS employee_name,
         u.phone AS employee_phone,
         du.full_name AS driver_name,
         du.phone AS driver_phone,
         v.vehicle_number,
         v.vehicle_type,
         v.model
       FROM trips t
       JOIN employees e ON e.id = t.employee_id
       JOIN users u ON u.id = e.user_id
       LEFT JOIN drivers d ON d.id = t.driver_id
       LEFT JOIN users du ON du.id = d.user_id
       LEFT JOIN vehicles v ON v.id = t.vehicle_id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /trips/:id (General status update)
router.put('/trips/:id', verifyToken, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE trips 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /trips/:id/verify-otp
router.post('/trips/:id/verify-otp', verifyToken, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP is required' });

  try {
    const tripScan = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    if (tripScan.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = tripScan.rows[0];

    if (trip.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Calculate duration using RouteMatcher
    const { getDistance } = await import('../services/routeMatcher.js');
    let durationSeconds = 600; // Default 10 minutes fallback
    try {
      const distInfo = await getDistance(trip.start_location, trip.end_location);
      if (distInfo && distInfo.durationSeconds) {
        durationSeconds = distInfo.durationSeconds;
      }
    } catch (e) {
      console.warn("Duration calculation failed, using fallback:", e.message);
    }

    const updated = await pool.query(
      `UPDATE trips 
       SET status = 'in_progress', 
           actual_start_time = CURRENT_TIMESTAMP, 
           expected_completion_time = CURRENT_TIMESTAMP + ($1 || ' seconds')::INTERVAL,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [durationSeconds, req.params.id]
    );

    console.log(`[TRIP] Trip ${req.params.id} started. Auto-completion in ${durationSeconds}s`);

    return res.json({ 
      message: 'OTP verified, trip started', 
      trip: updated.rows[0],
      estimatedDuration: durationSeconds 
    });
  } catch (err) {
    console.error('OTP Verification Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// consolidated auto-completion background worker moved to server.js

// POST /trips/:id/complete
router.post('/trips/:id/complete', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Mark trip as completed
    const tripRes = await client.query(
      `UPDATE trips 
       SET status = 'completed', 
           actual_end_time = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING route_id, driver_id`,
      [req.params.id]
    );

    if (tripRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { route_id, driver_id } = tripRes.rows[0];

    // 2. Check if all trips for this route are completed or cancelled
    if (route_id) {
      const remainingTrips = await client.query(
        `SELECT COUNT(*) FROM trips 
         WHERE route_id = $1 AND status IN ('scheduled', 'in_progress')`,
        [route_id]
      );

      if (parseInt(remainingTrips.rows[0].count) === 0) {
        // All trips done, mark route as completed
        await client.query(
          `UPDATE routes SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [route_id]
        );
      }
    }

    // 3. Mark driver as active again
    if (driver_id) {
       await client.query(
        `UPDATE drivers SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [driver_id]
      );
    }

    await client.query('COMMIT');
    return res.json({ message: 'Trip completed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
  // ==================== FEEDBACK ====================
  router.post('/feedback', verifyToken, async (req, res) => {
    const { trip_id, feedback_type, message, rating } = req.body;

    if (!trip_id || !feedback_type || rating === undefined) {
      return res.status(400).json({ error: 'trip_id, feedback_type, and rating are required' });
    }

    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Fetch trip details to find participants
      const tripRes = await pool.query(
        `SELECT t.driver_id, e.user_id as employee_user_id 
         FROM trips t 
         JOIN employees e ON t.employee_id = e.id 
         WHERE t.id = $1`, 
        [trip_id]
      );
      
      if (tripRes.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const { driver_id: tripDriverId, employee_user_id: passengerUserId } = tripRes.rows[0];

      // Determine the participants
      // If submitter is a driver, the target user_id in the feedback table will be the passenger
      // The driver_id in the feedback table will be the submitter's driver_id
      const result = await pool.query(
        `INSERT INTO feedback (trip_id, user_id, driver_id, feedback_type, message, rating, submitted_by_role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [trip_id, passengerUserId, tripDriverId, feedback_type, message || '', rating, userRole]
      );

      // Only update driver average rating if feedback is FROM an employee
      if (userRole === 'employee' && tripDriverId) {
        await pool.query(
          `UPDATE drivers d
           SET average_rating = COALESCE(
             (SELECT AVG(f.rating) FROM feedback f JOIN trips t ON f.trip_id = t.id WHERE t.driver_id = d.id AND f.submitted_by_role = 'employee'),
             0
           )
           WHERE d.id = $1`,
          [tripDriverId]
        );
      }

      return res.json({ message: 'Feedback submitted', feedback: result.rows[0] });
    } catch (err) {
      console.error('Feedback POST error:', err.message);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

router.get('/feedback/my-feedback', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = '';
    let params = [userId];

    if (userRole === 'driver') {
      // For drivers, feedback they submitted has their driver_id and submitted_by_role = 'driver'
      query = `
        SELECT 
          f.id, f.trip_id, f.feedback_type, f.message, f.rating, f.created_at,
          u.full_name AS employee_name,
          t.start_location, t.end_location
        FROM feedback f
        JOIN trips t ON t.id = f.trip_id
        JOIN employees e ON e.id = t.employee_id
        JOIN users u ON u.id = e.user_id
        JOIN drivers d ON d.id = t.driver_id
        WHERE d.user_id = $1 AND f.submitted_by_role = 'driver'
        ORDER BY f.created_at DESC`;
    } else {
      // For employees, feedback they submitted has their user_id and submitted_by_role = 'employee'
      query = `
        SELECT 
          f.id, f.trip_id, f.feedback_type, f.message, f.rating, f.created_at,
          du.full_name AS driver_name,
          t.start_location, t.end_location
        FROM feedback f
        JOIN trips t ON t.id = f.trip_id
        JOIN users u ON u.id = f.user_id
        LEFT JOIN drivers d ON d.id = f.driver_id
        LEFT JOIN users du ON du.id = d.user_id
        WHERE u.id = $1 AND (f.submitted_by_role = 'employee' OR f.submitted_by_role IS NULL)
        ORDER BY f.created_at DESC`;
    }

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('Feedback GET error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

router.get('/feedback', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         f.id,
         f.trip_id,
         f.feedback_type,
         f.message,
         f.rating,
         f.submitted_by_role,
         f.created_at,
         u.full_name AS employee_name,
         du.full_name AS driver_name,
         t.start_location,
         t.end_location
       FROM feedback f
       JOIN trips t ON t.id = f.trip_id
       JOIN employees e ON e.id = t.employee_id
       JOIN users u ON u.id = e.user_id
       LEFT JOIN drivers d ON d.id = t.driver_id
       LEFT JOIN users du ON du.id = d.user_id
       ORDER BY f.created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/feedback/:id/resolve', verifyToken, async (req, res) => {
  try {
    await pool.query(
      `UPDATE feedback SET is_resolved = true, resolved_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    return res.json({ message: 'Feedback marked as resolved' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /driver/feedback — feedback for the logged-in driver only
router.get('/driver/feedback', verifyToken, async (req, res) => {
  try {
    // Find driver id for this user
    const driverResult = await pool.query(
      `SELECT id FROM drivers WHERE user_id = $1`,
      [req.user.id]
    );
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver record not found' });
    }
    const driverId = driverResult.rows[0].id;

    const result = await pool.query(
      `SELECT
         f.id,
         f.trip_id,
         f.feedback_type,
         f.message,
         f.rating,
         f.created_at,
         f.is_resolved,
         u.full_name AS employee_name,
         t.start_location,
         t.end_location,
         r.route_name
       FROM feedback f
       JOIN trips t ON t.id = f.trip_id
       LEFT JOIN employees e ON e.id = t.employee_id
       LEFT JOIN users u ON u.id = e.user_id
       LEFT JOIN routes r ON r.id = t.route_id
       WHERE t.driver_id = $1 AND (f.submitted_by_role = 'employee' OR f.submitted_by_role IS NULL)
       ORDER BY f.created_at DESC`,
      [driverId]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/onboarding/driver', verifyToken, async (req, res) => {
  // ✅ FIXED: Destructure variables from req.body
  const { driverName, phone, licenseNumber, vehicleNumber, vehicleName, carModel, capacity, vehicleImage } = req.body;

  // ✅ FIXED: Check if variables exist
  if (!driverName || !phone || !licenseNumber || !vehicleNumber) {
    return res
      .status(400)
      .json({
        success: false,
        message: 'Missing required fields',
        error: 'driverName, phone, licenseNumber, and vehicleNumber are required',
        received: { driverName, phone, licenseNumber, vehicleNumber }
      });
  }

  // ✅ FIXED: Wrap in try/catch
  try {
    console.log("🚗 Driver onboarding request:", {
      userId: req.user.id,
      driverName,
      phone,
      licenseNumber,
      vehicleNumber,
      vehicleName,
      carModel,
      capacity
    });

    // Update user profile
    await pool.query(
      `UPDATE users
       SET full_name = $2,
           phone = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.user.id, driverName, phone]
    );

    // Upsert vehicle by vehicle_number
    const vehicleUpsert = await pool.query(
      `INSERT INTO vehicles (vehicle_number, vehicle_type, model, capacity, status, vehicle_image)
       VALUES ($1, $2, $3, $4, 'active', $5)
       ON CONFLICT (vehicle_number)
       DO UPDATE SET vehicle_type = COALESCE(EXCLUDED.vehicle_type, vehicles.vehicle_type),
                     model = COALESCE(EXCLUDED.model, vehicles.model),
                     capacity = COALESCE(EXCLUDED.capacity, vehicles.capacity),
                     vehicle_image = COALESCE(EXCLUDED.vehicle_image, vehicles.vehicle_image),
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [vehicleNumber, vehicleName || null, carModel || null, capacity || null, vehicleImage || null]
    );
    const vehicle = vehicleUpsert.rows[0];

    // Update driver record for this user
    let driverResult = await pool.query(
      `UPDATE drivers
       SET license_number = $2,
           vehicle_id = $3,
           status = 'active',
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [req.user.id, licenseNumber, vehicle.id]
    );

    if (driverResult.rows.length === 0) {
      // Missing driver record (e.g. Google OAuth signups), let's create it
      driverResult = await pool.query(
        `INSERT INTO drivers (user_id, license_number, vehicle_id, status, is_active)
         VALUES ($1, $2, $3, 'active', true)
         RETURNING *`,
        [req.user.id, licenseNumber, vehicle.id]
      );
    }

    // Link driver <-> vehicle as current driver
    await pool.query(
      `UPDATE vehicles
       SET current_driver_id = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [vehicle.id, driverResult.rows[0].id]
    );

    console.log("✅ Driver onboarding completed successfully:", {
      userId: req.user.id,
      driverId: driverResult.rows[0].id,
      vehicleId: vehicle.id
    });

    // ✅ FIXED: Return structured success response
    return res.status(200).json({
      success: true,
      message: 'Driver onboarding completed successfully',
      data: {
        full_name: driverName,
        phone,
        license_number: licenseNumber,
        vehicle_id: vehicle.id,
        vehicle_number: vehicleNumber
      }
    });

  } catch (error) {
    // ✅ FIXED: Proper error handling
    console.error("❌ Driver onboarding error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      message: 'Driver onboarding failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==================== EMPLOYEES ====================
router.get('/employees', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.full_name, u.email, u.phone, u.role
      FROM employees e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/employees/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.full_name, u.email, u.phone
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees', verifyToken, async (req, res) => {
  const { user_id, employee_id, department, designation, location } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO employees (user_id, employee_id, department, designation, location)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, employee_id, department, designation, location]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/employees/:id', verifyToken, async (req, res) => {
  const { department, designation, location, manager_id } = req.body;

  try {
    const result = await pool.query(`
      UPDATE employees
      SET department = COALESCE($2, department),
          designation = COALESCE($3, designation),
          location = COALESCE($4, location),
          manager_id = COALESCE($5, manager_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [req.params.id, department, designation, location, manager_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/employees/:id', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const empRes = await client.query('SELECT user_id FROM employees WHERE id = $1', [req.params.id]);
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    const userId = empRes.rows[0].user_id;

    // Unlink any employees who have this person as their manager
    await client.query('UPDATE employees SET manager_id = NULL WHERE manager_id = $1', [userId]);

    // Cascade deletes for relational consistency
    await client.query('DELETE FROM feedback WHERE trip_id IN (SELECT id FROM trips WHERE employee_id = $1)', [req.params.id]);
    await client.query('DELETE FROM feedback WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM payments WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM trips WHERE employee_id = $1', [req.params.id]);
    await client.query('DELETE FROM admin_logs WHERE admin_id = $1', [userId]);
    
    await client.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==================== DRIVERS ====================

// GET /drivers/me — driver's own profile + stats (must be before /:id)
router.get('/drivers/me', verifyToken, async (req, res) => {
  try {
    // 1. Driver record
    // NOTE: The column is 'rating' in the drivers table (not 'average_rating')
    const driverResult = await pool.query(`
      SELECT d.*, u.full_name, u.email, u.phone,
             v.vehicle_number, v.vehicle_type, v.model, v.capacity, v.status AS vehicle_status, v.vehicle_image,
             COALESCE(d.rating, 0) AS average_rating
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      WHERE d.user_id = $1
    `, [req.user.id]);

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver record not found' });
    }
    const driver = driverResult.rows[0];

    // 2. All trips assigned to this driver
    const tripsResult = await pool.query(`
      SELECT t.id, t.start_location, t.end_location, t.scheduled_time,
             t.actual_start_time, t.actual_end_time, t.status,
             u.full_name AS employee_name,
             v.vehicle_number, v.vehicle_type,
             r.route_name, r.waypoints AS route_waypoints,
             r.start_location AS route_start, r.end_location AS route_end
      FROM trips t
      LEFT JOIN employees e ON e.id = t.employee_id
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN routes r ON r.id = t.route_id
      WHERE t.driver_id = $1
      ORDER BY t.scheduled_time DESC
    `, [driver.id]);

    // 3. Rating count — computed live from feedback table
    const ratingResult = await pool.query(`
      SELECT COUNT(*) AS total_ratings, AVG(f.rating) AS avg_rating
      FROM feedback f
      JOIN trips t ON f.trip_id = t.id
      WHERE t.driver_id = $1
    `, [driver.id]);

    const today = new Date().toISOString().split('T')[0];
    // PostgreSQL returns Date objects; safely convert to ISO string before string methods
    const serializeTrip = (t) => ({
      ...t,
      scheduled_time: t.scheduled_time
        ? (t.scheduled_time instanceof Date
          ? t.scheduled_time.toISOString()
          : String(t.scheduled_time))
        : null,
      actual_start_time: t.actual_start_time
        ? (t.actual_start_time instanceof Date
          ? t.actual_start_time.toISOString()
          : String(t.actual_start_time))
        : null,
      actual_end_time: t.actual_end_time
        ? (t.actual_end_time instanceof Date
          ? t.actual_end_time.toISOString()
          : String(t.actual_end_time))
        : null,
    });
    const serializedTrips = tripsResult.rows.map(serializeTrip);
    const todayTrips = serializedTrips.filter(t => t.scheduled_time && t.scheduled_time.startsWith(today));
    const completedToday = todayTrips.filter(t => t.status === 'completed').length;
    const scheduledToday = todayTrips.filter(t => t.status === 'scheduled').length;
    const inProgressNow = serializedTrips.find(t => t.status === 'in_progress') || null;

    return res.json({
      driver,
      trips: serializedTrips,
      stats: {
        total_trips: tripsResult.rows.length,
        today_total: todayTrips.length,
        today_completed: completedToday,
        today_scheduled: scheduledToday,
        in_progress: inProgressNow,
        avg_rating: parseFloat(ratingResult.rows[0]?.avg_rating || 0).toFixed(1),
        total_ratings: parseInt(ratingResult.rows[0]?.total_ratings || 0),
      },
    });
  } catch (err) {
    console.error('❌ /drivers/me error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/drivers', verifyToken, async (req, res) => {

  try {
    const result = await pool.query(`
      SELECT d.*,
             u.full_name, u.email, u.phone,
             v.vehicle_number,
             CASE
               WHEN EXISTS (
                 SELECT 1 FROM trips t
                 WHERE t.driver_id = d.id
                   AND t.status IN ('scheduled', 'in_progress')
               ) THEN 'inactive'
               WHEN d.status = 'on_leave' THEN 'on_leave'
               ELSE 'active'
             END AS effective_status
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/drivers/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.full_name, u.email, u.phone, v.vehicle_number
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      WHERE d.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/drivers', verifyToken, async (req, res) => {
  const { user_id, license_number, license_expiry, vehicle_id } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO drivers (user_id, license_number, license_expiry, vehicle_id, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING *
    `, [user_id, license_number, license_expiry, vehicle_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/drivers/:id', verifyToken, async (req, res) => {
  const { status, vehicle_id } = req.body;

  try {
    const result = await pool.query(`
      UPDATE drivers
      SET status = COALESCE($2, status),
          vehicle_id = COALESCE($3, vehicle_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [req.params.id, status, vehicle_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/drivers/:id', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const drvRes = await client.query('SELECT user_id FROM drivers WHERE id = $1', [req.params.id]);
    if (drvRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Driver not found' });
    }
    const userId = drvRes.rows[0].user_id;

    // Unlink driver from routes and vehicles
    await client.query('UPDATE routes SET assigned_driver_id = NULL WHERE assigned_driver_id = $1', [req.params.id]);
    await client.query('UPDATE vehicles SET current_driver_id = NULL WHERE current_driver_id = $1', [req.params.id]);

    // Cascade deletes
    await client.query('DELETE FROM driver_locations WHERE driver_id = $1', [req.params.id]);
    await client.query('DELETE FROM feedback WHERE trip_id IN (SELECT id FROM trips WHERE driver_id = $1)', [req.params.id]);
    await client.query('DELETE FROM feedback WHERE driver_id = $1', [req.params.id]);
    await client.query('DELETE FROM trips WHERE driver_id = $1', [req.params.id]);
    
    // User level deletes
    await client.query('DELETE FROM feedback WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM payments WHERE user_id = $1', [userId]);

    await client.query('DELETE FROM drivers WHERE id = $1', [req.params.id]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/drivers/:id/earnings', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.id,
        d.earnings,
        d.total_trips,
        COUNT(t.id) as trips_this_month,
        SUM(t.cost) as earnings_this_month
      FROM drivers d
      LEFT JOIN trips t ON d.id = t.driver_id 
        AND EXTRACT(YEAR FROM t.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM t.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      WHERE d.id = $1
      GROUP BY d.id, d.earnings, d.total_trips
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== VEHICLES ====================
router.get('/vehicles', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.full_name as driver_name
      FROM vehicles v
      LEFT JOIN drivers d ON v.current_driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY v.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vehicles/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.full_name as driver_name
      FROM vehicles v
      LEFT JOIN drivers d ON v.current_driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE v.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', verifyToken, async (req, res) => {
  const { vehicle_number, vehicle_type, make, model, capacity } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO vehicles (vehicle_number, vehicle_type, make, model, capacity, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `, [vehicle_number, vehicle_type, make, model, capacity]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vehicles/:id', verifyToken, async (req, res) => {
  const { status, current_driver_id } = req.body;

  try {
    const result = await pool.query(`
      UPDATE vehicles
      SET status = COALESCE($2, status),
          current_driver_id = COALESCE($3, current_driver_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [req.params.id, status, current_driver_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vehicles/:id', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Unlink vehicle references
    await client.query('UPDATE routes SET vehicle_id = NULL WHERE vehicle_id = $1', [req.params.id]);
    await client.query('UPDATE drivers SET vehicle_id = NULL WHERE vehicle_id = $1', [req.params.id]);
    await client.query('UPDATE trips SET vehicle_id = NULL WHERE vehicle_id = $1', [req.params.id]);

    const result = await client.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==================== TRIPS ====================
router.get('/trips', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             e.employee_id, eu.full_name as employee_name,
             d.id as driver_id, du.full_name as driver_name,
             v.vehicle_number
      FROM trips t
      LEFT JOIN employees e ON t.employee_id = e.id
      LEFT JOIN users eu ON e.user_id = eu.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trips/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             e.employee_id, eu.full_name as employee_name, eu.phone as employee_phone,
             d.id as driver_id, du.full_name as driver_name, du.phone as driver_phone,
             v.vehicle_number
      FROM trips t
      LEFT JOIN employees e ON t.employee_id = e.id
      LEFT JOIN users eu ON e.user_id = eu.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trips', verifyToken, async (req, res) => {
  const { employee_id, start_location, end_location, scheduled_time, driver_id: bodyDriverId, vehicle_id: bodyVehicleId } = req.body;

  try {
    // If admin didn't specify a driver, auto-assign the first available one
    let driver_id = bodyDriverId || null;
    let vehicle_id = bodyVehicleId || null;

    if (!driver_id) {
      // 🧪 TESTING: Always try Suyash (driver_id=5) first
      // Falls back to least-busy available driver if Suyash is busy/inactive
      const TEST_PREFERRED_DRIVER_ID = 5;

      const preferred = await pool.query(
        `SELECT d.id, d.vehicle_id
         FROM drivers d
         WHERE d.id = $1
           AND d.status = 'active'
           AND d.vehicle_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM trips t
             WHERE t.driver_id = d.id
               AND t.status IN ('scheduled', 'in_progress')
           )
         LIMIT 1`,
        [TEST_PREFERRED_DRIVER_ID]
      );

      if (preferred.rows.length > 0) {
        // Suyash is available — assign to him
        driver_id = preferred.rows[0].id;
        vehicle_id = vehicle_id || preferred.rows[0].vehicle_id;
        console.log(`🚗 Auto-assigned to preferred driver_id=${driver_id} (Suyash)`);
      } else {
        // Suyash is busy/inactive — fall back to least-busy available driver
        const avail = await pool.query(
          `SELECT d.id, d.vehicle_id, COUNT(t.id) AS trip_count
           FROM drivers d
           LEFT JOIN trips t ON t.driver_id = d.id
           WHERE d.status = 'active'
             AND d.vehicle_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1 FROM trips t2
               WHERE t2.driver_id = d.id
                 AND t2.status IN ('scheduled', 'in_progress')
             )
           GROUP BY d.id, d.vehicle_id
           ORDER BY trip_count ASC, d.id ASC
           LIMIT 1`
        );
        if (avail.rows.length > 0) {
          driver_id = avail.rows[0].id;
          vehicle_id = vehicle_id || avail.rows[0].vehicle_id;
          console.log(`🚗 Fallback auto-assigned driver_id=${driver_id} (trip_count=${avail.rows[0].trip_count})`);
        } else {
          console.log('⚠️  No available drivers found for auto-assignment');
        }
      }
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const result = await pool.query(`
      INSERT INTO trips (employee_id, driver_id, vehicle_id, start_location, end_location, scheduled_time, status, otp)
      VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7)
      RETURNING *
    `, [employee_id, driver_id, vehicle_id, start_location, end_location, scheduled_time, otp]);

    // 📧 Fetch employee email for notification
    try {
      const empRes = await pool.query(
        `SELECT u.email FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1`,
        [employee_id]
      );
      if (empRes.rows.length > 0) {
        const email = empRes.rows[0].email;
        // Fire and forget email (don't block response)
        sendTripOTPEmail(email, otp, start_location, end_location, scheduled_time)
          .then(() => console.log(`✅ Trip OTP email sent to ${email}`))
          .catch(err => console.error(`❌ Failed to send trip OTP email:`, err));
      }
    } catch (err) {
      console.error('Error fetching email for trip notification:', err);
    }

    // Reference log for terminal
    console.log('-----------------------------------------');
    console.log('🆕 NEW TRIP CREATED');
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Employee ID: ${employee_id}`);
    console.log(`Driver ID: ${driver_id || 'TBD'}`);
    console.log(`OTP: ${otp}`);
    console.log('-----------------------------------------');

    // Mark assigned driver inactive (on trip)
    if (driver_id) {
      await pool.query(
        `UPDATE drivers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [driver_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trips/:id/verify-otp', verifyToken, async (req, res) => {
  const { otp } = req.body;
  
  try {
    const current = await pool.query(`SELECT id, otp, status FROM trips WHERE id = $1`, [req.params.id]);
    
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    const trip = current.rows[0];
    
    // Only verify OTP for scheduled trips
    if (trip.status !== 'scheduled') {
      return res.status(400).json({ error: 'Trip is not in scheduled state' });
    }
    
    if (trip.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Update trip status to in_progress
    const result = await pool.query(`
      UPDATE trips
      SET status = 'in_progress',
          actual_start_time = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [req.params.id]);
    
    res.json({ message: 'OTP verified successfully. Trip started.', trip: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/trips/:id', verifyToken, async (req, res) => {
  const { status, driver_id, vehicle_id } = req.body;

  try {
    // Fetch current trip before update to know the driver
    const current = await pool.query(`SELECT driver_id FROM trips WHERE id = $1`, [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const currentDriverId = current.rows[0].driver_id;

    const result = await pool.query(`
      UPDATE trips
      SET status = COALESCE($2, status),
          driver_id = COALESCE($3, driver_id),
          vehicle_id = COALESCE($4, vehicle_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [req.params.id, status, driver_id, vehicle_id]);

    const updatedTrip = result.rows[0];

    // If trip is now completed or cancelled, free up the driver
    if (status === 'completed' || status === 'cancelled') {
      const driverToFree = driver_id || currentDriverId;
      if (driverToFree) {
        // Only set active if driver has no other active trips
        await pool.query(
          `UPDATE drivers
           SET status = 'active', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
             AND NOT EXISTS (
               SELECT 1 FROM trips t
               WHERE t.driver_id = $1
                 AND t.id != $2
                 AND t.status IN ('scheduled', 'in_progress')
             )`,
          [driverToFree, req.params.id]
        );
      }

      // NEW Feature: Auto-remove route once ALL trips for it are completed/cancelled (User Request)
      if (status === 'completed' && updatedTrip.route_id) {
        // Check if there are any other active trips for this route
        const activeTripsCheck = await pool.query(
          `SELECT id FROM trips WHERE route_id = $1 AND status IN ('scheduled', 'in_progress') AND id != $2`,
          [updatedTrip.route_id, req.params.id]
        );

        if (activeTripsCheck.rows.length === 0) {
          console.log(`🧹 All trips finished. Auto-cleaning up route_id=${updatedTrip.route_id}`);
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            // We keep the current trip for a moment to satisfy feedback constraints if any, 
            // but the user wants the "route" removed.
            // If we want to keep feedback, we should probably only delete the route but not the trips/feedback.
            // However, the user's previous preference was a cascading delete.
            // For now, let's just mark the route as 'completed' instead of hard deleting if we want to preserve history.
            // But to satisfy "remove", we will soft-delete or filter.
            // Let's stick to the user's "remove" request but ensure it's the last one.
            
            await client.query('UPDATE routes SET status = \'completed\', updated_at = NOW() WHERE id = $1', [updatedTrip.route_id]);
            await client.query('COMMIT');
          } catch (e) {
            await client.query('ROLLBACK');
            console.error('❌ Failed auto-cleanup of route:', e.message);
          } finally {
            client.release();
          }
        } else {
          console.log(`ℹ️ Route ${updatedTrip.route_id} still has ${activeTripsCheck.rows.length} active trips. Postponing cleanup.`);
        }
      }
    }

    // If a new driver_id is being assigned to this trip, mark them inactive
    if (driver_id && driver_id !== currentDriverId) {
      await pool.query(
        `UPDATE drivers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [driver_id]
      );
      // Free old driver if they no longer have active trips
      if (currentDriverId && currentDriverId !== driver_id) {
        await pool.query(
          `UPDATE drivers
           SET status = 'active', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
             AND NOT EXISTS (
               SELECT 1 FROM trips t
               WHERE t.driver_id = $1 AND t.status IN ('scheduled', 'in_progress')
             )`,
          [currentDriverId]
        );
      }
    }

    res.json(updatedTrip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PAYMENTS ====================
router.get('/payments', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.full_name, t.id as trip_id
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN trips t ON p.trip_id = t.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments', verifyToken, async (req, res) => {
  const { trip_id, user_id, amount, payment_method, transaction_id } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO payments (trip_id, user_id, amount, payment_method, status, transaction_id)
      VALUES ($1, $2, $3, $4, 'completed', $5)
      RETURNING *
    `, [trip_id, user_id, amount, payment_method, transaction_id || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PAYOUTS (STRIPE DEMO) ====================

// Ensure payouts table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('driver', 'employee')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'inr',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
    transaction_id VARCHAR(255),
    description TEXT,
    notes TEXT,
    processed_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.warn('Payouts table migration warning:', err.message));

// POST /payments/payout — Create a Payout
router.post('/payments/payout', verifyToken, async (req, res) => {
  const { recipient_id, recipient_type, amount, currency = 'inr', description, transaction_id } = req.body;

  if (!recipient_id || !recipient_type || !amount) {
    return res.status(400).json({ error: 'recipient_id, recipient_type, and amount are required' });
  }

  try {
    // If a transaction_id is provided from a successful Razorpay payment, mark as success immediately
    const initialStatus = transaction_id ? 'success' : 'processing';

    // 1. Log the payout in our DB
    const payoutResult = await pool.query(`
      INSERT INTO payouts (recipient_id, recipient_type, amount, currency, status, description, processed_by, transaction_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [recipient_id, recipient_type, parseFloat(amount), currency, initialStatus, description || null, req.user.id, transaction_id || null]);
    
    const payout = payoutResult.rows[0];

    // 2. Perform side effects (increment earnings) immediately if success
    if (initialStatus === 'success' && recipient_type === 'driver') {
      await pool.query(
        `UPDATE drivers SET earnings = COALESCE(earnings, 0) + $2, updated_at = NOW() WHERE id = $1`,
        [recipient_id, parseFloat(amount)]
      );
    }

    // 3. Simulate background success ONLY if it was initial 'processing' (standard mock flow)
    if (initialStatus === 'processing') {
      setTimeout(async () => {
        const mockTxId = `TXN_${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
        await pool.query(
          `UPDATE payouts SET status = 'success', transaction_id = $2, updated_at = NOW() WHERE id = $1`,
          [payout.id, mockTxId]
        );
        
        if (recipient_type === 'driver') {
          await pool.query(
            `UPDATE drivers SET earnings = COALESCE(earnings, 0) + $2, updated_at = NOW() WHERE id = $1`,
            [recipient_id, parseFloat(amount)]
          );
        }
      }, 2500);
    }

    return res.json({
      success: true,
      payout,
      message: initialStatus === 'success' ? 'Payout recorded successfully' : 'Payout initiated successfully via Payment Gateway',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /payments/history — Payout history (admin)
router.get('/payments/history', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        CASE WHEN p.recipient_type = 'driver' THEN u_driver.full_name
             WHEN p.recipient_type = 'employee' THEN u_emp.full_name
        END AS recipient_name,
        CASE WHEN p.recipient_type = 'driver' THEN u_driver.email
             WHEN p.recipient_type = 'employee' THEN u_emp.email
        END AS recipient_email,
        v.vehicle_number,
        admin_u.full_name AS processed_by_name
      FROM payouts p
      LEFT JOIN drivers d ON p.recipient_type = 'driver' AND p.recipient_id = d.id
      LEFT JOIN users u_driver ON d.user_id = u_driver.id
      LEFT JOIN employees e ON p.recipient_type = 'employee' AND p.recipient_id = e.id
      LEFT JOIN users u_emp ON e.user_id = u_emp.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      LEFT JOIN users admin_u ON p.processed_by = admin_u.id
      ORDER BY p.created_at DESC
      LIMIT 200
    `);
    return res.json({ success: true, payouts: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Payout history error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /payments/driver/my-payouts — Driver's own received payouts
router.get('/payments/driver/my-payouts', verifyToken, async (req, res) => {
  try {
    const driverResult = await pool.query(
      `SELECT d.id, d.earnings FROM drivers d WHERE d.user_id = $1`,
      [req.user.id]
    );
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver record not found' });
    }
    const driverId = driverResult.rows[0].id;
    const totalEarnings = parseFloat(driverResult.rows[0].earnings || 0);

    const result = await pool.query(`
      SELECT p.*, admin_u.full_name AS processed_by_name
      FROM payouts p
      LEFT JOIN users admin_u ON p.processed_by = admin_u.id
      WHERE p.recipient_type = 'driver' AND p.recipient_id = $1
      ORDER BY p.created_at DESC
      LIMIT 100
    `, [driverId]);

    const payouts = result.rows;
    const successPayouts = payouts.filter(p => p.status === 'success');
    const totalReceived = successPayouts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingAmount = payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return res.json({
      success: true,
      payouts,
      summary: {
        total_payouts: payouts.length,
        success_payouts: successPayouts.length,
        total_received: totalReceived,
        pending_amount: pendingAmount,
        total_earnings: totalEarnings,
      }
    });
  } catch (err) {
    console.error('Driver payouts error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /payments/payout/:id/update — Update payout status
router.put('/payments/payout/:id/update', verifyToken, async (req, res) => {
  const { status, transaction_id } = req.body;
  try {
    const result = await pool.query(`
      UPDATE payouts SET status = COALESCE($2, status),
        transaction_id = COALESCE($3, transaction_id), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [req.params.id, status, transaction_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payout not found' });
    return res.json({ success: true, payout: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Removed Stripe-specific PaymentIntent and Confirm routes as per transition to Razorpay

// GET /payments/stats — Admin payment stats
router.get('/payments/stats', verifyToken, async (req, res) => {
  try {
    const [payoutsStats, paymentsStats] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total_payouts,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
          COUNT(CASE WHEN status IN ('pending','processing') THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_paid_out,
          COALESCE(SUM(CASE WHEN status IN ('pending','processing') THEN amount ELSE 0 END), 0) as pending_amount
        FROM payouts
      `),
      pool.query(`
        SELECT
          COUNT(*) as total_transactions,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue
        FROM payments
      `),
    ]);
    return res.json({ success: true, stats: { ...payoutsStats.rows[0], ...paymentsStats.rows[0] } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});



// ==================== ROUTES ====================
router.get('/routes', verifyToken, async (req, res) => {
  try {
    let query = `
      SELECT r.*, u.full_name as driver_name,
        CASE 
          WHEN (
            SELECT COUNT(t.id) FROM trips t WHERE t.route_id = r.id
          ) > 0 AND (
            SELECT COUNT(t.id) FROM trips t WHERE t.route_id = r.id AND t.status IN ('scheduled', 'in_progress')
          ) = 0
          THEN 'completed'
          ELSE r.status 
        END as display_status
      FROM routes r
      LEFT JOIN drivers d ON r.assigned_driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
    `;
    let params = [];

    // Filter by assigned driver if the requester is a driver
    if (req.user.role === 'driver') {
      query += ` WHERE d.user_id = $1`;
      params.push(req.user.id);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);

    // Map display_status to status to ensure UI shows the derived status dynamically
    const rows = result.rows.map(row => {
      if (row.display_status === 'completed' && row.status !== 'completed') {
        row.status = 'completed';
      }
      delete row.display_status;
      return row;
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/routes/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.full_name as driver_name, v.vehicle_number
      FROM routes r
      LEFT JOIN drivers d ON r.assigned_driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/routes/:id/details', verifyToken, async (req, res) => {
  try {
    const routeRes = await pool.query(`
      SELECT r.*, u.full_name as driver_name, v.vehicle_number
      FROM routes r
      LEFT JOIN drivers d ON r.assigned_driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = $1
    `, [req.params.id]);

    if (routeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const tripsRes = await pool.query(`
      SELECT t.*, eu.full_name as employee_name, eu.phone as employee_phone
      FROM trips t
      JOIN employees e ON t.employee_id = e.id
      JOIN users eu ON e.user_id = eu.id
      WHERE t.route_id = $1
      ORDER BY t.sequence_number ASC, t.created_at ASC
    `, [req.params.id]);

    res.json({
      ...routeRes.rows[0],
      trips: tripsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/routes', verifyToken, async (req, res) => {
  const {
    route_name, start_location, end_location,
    distance, estimated_duration,
    assigned_driver_id, vehicle_id,
    waypoints,       // optional: array of intermediate stop strings
    max_passengers,  // optional: override capacity
    scheduled_time,  // added: from the frontend
    employee_ids,    // added: Array of user/employee IDs
  } = req.body;

  if (!route_name || !start_location || !end_location) {
    return res.status(400).json({ error: 'route_name, start_location, and end_location are required' });
  }

  try {
    // Optionally geocode start/end via Google Maps
    let start_lat = null, start_lng = null, end_lat = null, end_lng = null;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (GOOGLE_MAPS_API_KEY) {
      try {
        const geocode = async (address) => {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
          const r = await fetch(url);
          const d = await r.json();
          if (d.status === 'OK' && d.results[0]) {
            const { lat, lng } = d.results[0].geometry.location;
            return { lat, lng };
          }
          return null;
        };
        const [startGeo, endGeo] = await Promise.all([geocode(start_location), geocode(end_location)]);
        if (startGeo) { start_lat = startGeo.lat; start_lng = startGeo.lng; }
        if (endGeo) { end_lat = endGeo.lat; end_lng = endGeo.lng; }
      } catch (geoErr) {
        console.warn('Geocoding failed (non-fatal):', geoErr.message);
      }
    }

    // Determine max_passengers from vehicle capacity or override
    let resolvedMaxPassengers = max_passengers || null;
    if (!resolvedMaxPassengers && vehicle_id) {
      const veh = await pool.query(`SELECT capacity FROM vehicles WHERE id = $1`, [vehicle_id]);
      resolvedMaxPassengers = veh.rows[0]?.capacity || 10;
    }

    const result = await pool.query(`
      INSERT INTO routes
        (route_name, start_location, end_location,
         distance, estimated_duration,
         assigned_driver_id, vehicle_id, status,
         waypoints, max_passengers,
         start_lat, start_lng, end_lat, end_lng)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'planned',$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      route_name, start_location, end_location,
      distance || null, estimated_duration || null,
      assigned_driver_id || null, vehicle_id || null,
      JSON.stringify(waypoints || []),
      resolvedMaxPassengers,
      start_lat, start_lng, end_lat, end_lng,
    ]);

    const newRoute = result.rows[0];

    // Mark driver inactive when a route is actively assigned to them and status is active
    if (assigned_driver_id) {
      await pool.query(
        `UPDATE drivers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [assigned_driver_id]
      );
    }

    // Connect database: Generate trips for selected employees immediately based on the route
    if (Array.isArray(employee_ids) && employee_ids.length > 0 && scheduled_time) {
      console.log(`📦 Generating ${employee_ids.length} trips for route ${newRoute.id}...`);
      
      for (let i = 0; i < employee_ids.length; i++) {
        const empId = employee_ids[i];
        const sequence = i + 1; // 1-based sequence
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        await pool.query(`
          INSERT INTO trips (employee_id, route_id, driver_id, vehicle_id, start_location, end_location, scheduled_time, status, otp, sequence_number)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8, $9)
        `, [
          empId,
          newRoute.id,
          assigned_driver_id || null,
          vehicle_id || null,
          start_location,
          end_location,
          scheduled_time,
          otp,
          sequence
        ]);

        // 📧 Fetch employee email for notification
        try {
          const empRes = await pool.query(
            `SELECT u.email FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1`,
            [empId]
          );
          if (empRes.rows.length > 0) {
            const email = empRes.rows[0].email;
            sendTripOTPEmail(email, otp, start_location, end_location, scheduled_time)
              .then(() => console.log(`✅ [Admin Route] Trip OTP email sent to ${email} (OTP: ${otp})`))
              .catch(err => console.error(`❌ [Admin Route] Failed to send email to ${email}:`, err));
          }
        } catch (err) {
          console.error(`Error fetching email for employee ${empId}:`, err);
        }

        // Terminal Reference
        console.log(`🎫 Trip created for Employee ${empId} | OTP: ${otp}`);
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/routes/:id', verifyToken, async (req, res) => {
  const { route_name, start_location, end_location, distance, estimated_duration, assigned_driver_id, vehicle_id, status } = req.body;

  try {
    const result = await pool.query(`
      UPDATE routes
      SET route_name = COALESCE($2, route_name),
          start_location = COALESCE($3, start_location),
          end_location = COALESCE($4, end_location),
          distance = COALESCE($5, distance),
          estimated_duration = COALESCE($6, estimated_duration),
          assigned_driver_id = COALESCE($7, assigned_driver_id),
          vehicle_id = COALESCE($8, vehicle_id),
          status = COALESCE($9, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [req.params.id, route_name, start_location, end_location, distance, estimated_duration, assigned_driver_id, vehicle_id, status]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/routes/:id', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete associated trip data for all trips linked to this route
    const tripIdsResult = await client.query('SELECT id FROM trips WHERE route_id = $1', [req.params.id]);
    const tripIds = tripIdsResult.rows.map(r => r.id);

    if (tripIds.length > 0) {
      await client.query('DELETE FROM feedback WHERE trip_id = ANY($1)', [tripIds]);
      await client.query('DELETE FROM driver_locations WHERE trip_id = ANY($1)', [tripIds]);
      await client.query('DELETE FROM payments WHERE trip_id = ANY($1)', [tripIds]);
      await client.query('DELETE FROM trips WHERE route_id = $1', [req.params.id]);
    }

    // 2. Delete the route itself
    const result = await client.query('DELETE FROM routes WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Route not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Route and all associated trip data deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE /routes/:id error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==================== DRIVER LOCATION TRACKING ====================
router.post('/location/track', verifyToken, async (req, res) => {
  const { driver_id, latitude, longitude, speed, heading, accuracy, trip_id } = req.body;

  // Validation
  if (!driver_id || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'driver_id, latitude, and longitude are required' });
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'latitude and longitude must be valid numbers' });
  }

  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({ error: 'latitude must be between -90 and 90' });
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'longitude must be between -180 and 180' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO driver_locations (driver_id, latitude, longitude, speed, heading, accuracy, trip_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [driver_id, latitude, longitude, speed || null, heading || null, accuracy || null, trip_id || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current driver location
router.get('/location/driver/:driver_id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM driver_locations
      WHERE driver_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `, [req.params.driver_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No location data for this driver' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all active driver locations (for admin tracking)
router.get('/location/active', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT dl.*, d.id as driver_id, u.full_name as driver_name, v.vehicle_number
      FROM (
        SELECT DISTINCT ON (driver_id) * FROM driver_locations
        ORDER BY driver_id, timestamp DESC
      ) dl
      LEFT JOIN drivers d ON dl.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      WHERE dl.timestamp > NOW() - INTERVAL '1 hour'
      ORDER BY dl.timestamp DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get location history for a trip
router.get('/location/trip/:trip_id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT dl.*, u.full_name as driver_name
      FROM driver_locations dl
      LEFT JOIN drivers d ON dl.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE dl.trip_id = $1
      ORDER BY dl.timestamp ASC
    `, [req.params.trip_id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/location/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      DELETE FROM driver_locations WHERE id = $1 RETURNING *
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location record not found' });
    }

    res.json({ message: 'Location record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EMERGENCY / SOS ====================
router.post('/emergency/trigger', verifyToken, async (req, res) => {
  const { userId, tripId, location, timestamp, emergencyLevel, status, description } = req.body;

  try {
    const lat = location?.latitude || null;
    const lng = location?.longitude || null;

    const result = await pool.query(`
      INSERT INTO emergencies (user_id, trip_id, latitude, longitude, status, created_at)
      VALUES ($1, $2, $3, $4, 'active', $5)
      RETURNING *
    `, [userId || req.user.id, tripId || null, lat, lng, timestamp || new Date()]);

    const emergency = result.rows[0];

    // Broadcast to Admin via Socket.IO
    const io = req.app.get('io');
    if (io) {
      console.log(`🚨 SOS ALERT: User ${userId} at ${lat}, ${lng}`);
      io.to('admin_tracking').emit('emergency:alert', {
        ...emergency,
        userName: req.body.userName,
        userEmail: req.body.userEmail,
        userPhone: req.body.userPhone,
        description: description || 'Emergency SOS alert triggered'
      });
    }

    res.status(201).json({ success: true, emergency });
  } catch (err) {
    console.error('❌ SOS Trigger error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/emergency/active', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
             r.route_name, t.start_location, t.end_location
      FROM emergencies e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN trips t ON e.trip_id = t.id
      LEFT JOIN routes r ON t.route_id = r.id
      WHERE e.status = 'active'
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/emergency/logs', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
             r.route_name, t.start_location, t.end_location
      FROM emergencies e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN trips t ON e.trip_id = t.id
      LEFT JOIN routes r ON t.route_id = r.id
      ORDER BY e.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
