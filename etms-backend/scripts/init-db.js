import pool from "../config/db.js";
import { initializeDatabaseIfNeeded } from "../config/databaseBootstrap.js";

const main = async () => {
  try {
    const initialized = await initializeDatabaseIfNeeded();
    if (!initialized) {
      console.log("No initialization needed.");
    }
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
};

await main();
