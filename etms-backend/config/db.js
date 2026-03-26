import pkg from "pg";
import dotenv from "dotenv";
const { Pool } = pkg;

dotenv.config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const pool = new Pool(
  hasDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.DB_SSL === "true" || process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        user: process.env.DB_USER || "etms",
        password: process.env.DB_PASSWORD || "aaku28",
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "etms",
        port: process.env.DB_PORT || 5432,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      }
);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});
console.log("PG_USER =", process.env.DB_USER);
console.log("PG_PASSWORD =", process.env.DB_PASSWORD);
if (hasDatabaseUrl) {
  console.log("Using DATABASE_URL for PostgreSQL connection");
}

export default pool;
