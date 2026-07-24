import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tableExists = async (tableName) => {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [tableName]
  );

  return result.rows[0]?.exists === true;
};

// Existing databases are not recreated when schema.sql changes. Keep the
// feedback columns used by the API in sync on every server start.
const ensureFeedbackSchema = async () => {
  await pool.query(`
    ALTER TABLE feedback
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES drivers(id),
      ADD COLUMN IF NOT EXISTS submitted_by_role VARCHAR(20),
      ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP
  `);

  // Older feedback rows did not store the submitter role. They were created
  // by employees, and user_id can be recovered from the linked trip.
  await pool.query(`
    UPDATE feedback f
    SET user_id = e.user_id,
        submitted_by_role = COALESCE(f.submitted_by_role, 'employee')
    FROM trips t
    JOIN employees e ON e.id = t.employee_id
    WHERE f.trip_id = t.id
      AND (f.user_id IS NULL OR f.submitted_by_role IS NULL)
  `);
};

export const initializeDatabaseIfNeeded = async () => {
  const hasTripsTable = await tableExists("trips");

  let initialized = false;

  if (!hasTripsTable) {
    const schemaPath = path.resolve(__dirname, "../database/schema.sql");
    const schemaSql = await fs.readFile(schemaPath, "utf8");

    console.log(`Trips table missing. Initializing schema from ${schemaPath}...`);
    await pool.query(schemaSql);

    const { default: migrateGoogleMaps } = await import("../scripts/migrate-google-maps.js");
    const { default: addExpectedCompletion } = await import("../scripts/add_expected_completion.js");

    await migrateGoogleMaps();
    await addExpectedCompletion();
    initialized = true;
  } else {
    console.log("Database schema already present.");
  }

  await ensureFeedbackSchema();
  return initialized;
};
