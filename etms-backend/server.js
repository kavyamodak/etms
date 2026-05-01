import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from "./config/db.js";
import passport from "./config/passport.js";
import { initializeDatabaseIfNeeded } from "./config/databaseBootstrap.js";
import { getAllowedOrigins, warnIfDeploymentUrlsMissing } from "./config/runtimeUrls.js";
import authRoutes from "./routes/auth.routes.js";
import resourceRoutes from "./routes/resources.routes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";

const app = express();
const httpServer = createServer(app);
const allowedOrigins = getAllowedOrigins();

const corsOriginValidator = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  const normalizedOrigin = origin.replace(/\/$/, "");
  if (allowedOrigins.includes(normalizedOrigin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
};

// ─── Socket.IO setup ────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: corsOriginValidator,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});
app.set('io', io);

// Track which socket belongs to which driver
const driverSockets = new Map(); // driverId -> socketId

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ── Driver joins ──────────────────────────────────────────────
  socket.on("driver:join", ({ driver_id }) => {
    driverSockets.set(driver_id, socket.id);
    socket.join(`driver:${driver_id}`);
    socket.join("drivers");          // room for all drivers
    console.log(`🚗 Driver ${driver_id} joined (socket ${socket.id})`);
    io.emit("driver:online", { driver_id });
  });

  // ── Driver broadcasts location ────────────────────────────────
  // Payload: { driver_id, latitude, longitude, speed?, heading?, accuracy?, trip_id? }
  socket.on("driver:location", async (data) => {
    const { driver_id, latitude, longitude, speed, heading, accuracy, trip_id } = data;
    if (!driver_id || latitude == null || longitude == null) return;

    // Persist to DB
    try {
      await pool.query(
        `INSERT INTO driver_locations (driver_id, latitude, longitude, speed, heading, accuracy, trip_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [driver_id, latitude, longitude, speed ?? null, heading ?? null, accuracy ?? null, trip_id ?? null]
      );
    } catch (err) {
      console.error("❌ Failed to save driver location:", err.message);
    }

    // Broadcast to admin room and the specific trip room
    const payload = { driver_id, latitude, longitude, speed, heading, accuracy, trip_id, timestamp: new Date().toISOString() };
    io.to("admin_tracking").emit("location:update", payload);
    if (trip_id) {
      io.to(`trip:${trip_id}`).emit("location:update", payload);
    }
  });

  // ── Trip status change ────────────────────────────────────────
  socket.on("trip:status", ({ trip_id, status, driver_id }) => {
    const payload = { trip_id, status, driver_id, timestamp: new Date().toISOString() };
    io.emit("trip:statusChanged", payload);
    console.log(`📍 Trip ${trip_id} → ${status}`);
  });

  // ── Admin joins tracking room ─────────────────────────────────
  socket.on("admin:joinTracking", () => {
    socket.join("admin_tracking");
    console.log(`👨‍💼 Admin joined tracking room (socket ${socket.id})`);
  });

  // ── Subscribe to a specific trip ─────────────────────────────
  socket.on("trip:subscribe", ({ trip_id }) => {
    socket.join(`trip:${trip_id}`);
  });

  // ── Cleanup on disconnect ─────────────────────────────────────
  socket.on("disconnect", () => {
    // Remove driver from map if it was a driver socket
    for (const [driverId, sockId] of driverSockets.entries()) {
      if (sockId === socket.id) {
        driverSockets.delete(driverId);
        io.emit("driver:offline", { driver_id: driverId });
        console.log(`🔴 Driver ${driverId} went offline`);
        break;
      }
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

const syncTripStatuses = async () => {
  try {
    // 1. Auto-complete 'in_progress' trips whose expected_completion_time has passed
    const completedTrips = await pool.query(`
      UPDATE trips 
      SET status = 'completed', 
          actual_end_time = expected_completion_time, 
          updated_at = CURRENT_TIMESTAMP
      WHERE status = 'in_progress' 
        AND expected_completion_time <= CURRENT_TIMESTAMP
      RETURNING id, route_id, driver_id;
    `);

    if (completedTrips.rowCount > 0) {
      console.log(`⏱️ Auto-sync: ${completedTrips.rowCount} trips auto-completed.`);
      
      for (const trip of completedTrips.rows) {
          // Re-activate driver
          if (trip.driver_id) {
              await pool.query("UPDATE drivers SET status = 'active' WHERE id = $1", [trip.driver_id]);
          }

          // Complete route if all its trips are done
          if (trip.route_id) {
              const remaining = await pool.query(
                  "SELECT COUNT(*) FROM trips WHERE route_id = $1 AND status IN ('scheduled', 'in_progress')",
                  [trip.route_id]
              );
              if (parseInt(remaining.rows[0].count) === 0) {
                  await pool.query("UPDATE routes SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [trip.route_id]);
              }
          }
      }
      
      io.emit('trip:statusChanged', { refresh_needed: true, timestamp: new Date().toISOString() });
    }
  } catch (err) {
    console.error("Auto-sync interval error:", err.message);
  }
};

// ─── Express middleware ──────────────────────────────────────────
app.use(cors({
  origin: corsOriginValidator,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Emergency-Priority'],
  credentials: true,
  optionsSuccessStatus: 200,
}));
// Handle preflight for all routes (use regex pattern for Express v5 compatibility)
app.options(/.*/, cors({ origin: corsOriginValidator, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.use(passport.initialize());

// ─── Routes ─────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api", resourceRoutes);
app.use("/api/razorpay", razorpayRoutes);

// Health check (now also reports socket.io)
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    socket_io: "enabled",
    connected_clients: io.engine.clientsCount,
  });
});

// ─── DB connection ───────────────────────────────────────────────
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ PostgreSQL error:", err.message));

try {
  await initializeDatabaseIfNeeded();
} catch (err) {
  console.error("❌ Database bootstrap error:", err.message);
}

// Run the sync function immediately on server startup to catch up on any missed events while offline
syncTripStatuses();

// Then run it every 60 seconds
setInterval(syncTripStatuses, 60000);

// ─── Start server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  warnIfDeploymentUrlsMissing();
  console.log(`✅ Server + Socket.IO running on port ${PORT}`);
});
