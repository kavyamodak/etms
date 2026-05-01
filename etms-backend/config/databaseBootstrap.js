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

export const initializeDatabaseIfNeeded = async () => {
  const hasTripsTable = await tableExists("trips");
  if (hasTripsTable) {
    console.log("Database schema already present.");
    return false;
  }

  const schemaPath = path.resolve(__dirname, "../database/schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  console.log(`Trips table missing. Initializing schema from ${schemaPath}...`);
  await pool.query(schemaSql);

  const { default: migrateGoogleMaps } = await import("../scripts/migrate-google-maps.js");
  const { default: addExpectedCompletion } = await import("../scripts/add_expected_completion.js");

  await migrateGoogleMaps();
  await addExpectedCompletion();

  console.log("Database schema initialization completed.");
  return true;
};
