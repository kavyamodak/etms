import pool from '../config/db.js';

async function migrate() {
  try {
    console.log("Checking for expected_completion_time column...");
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trips' AND column_name = 'expected_completion_time'
    `);

    if (checkColumn.rows.length === 0) {
      console.log("Adding expected_completion_time column to trips table...");
      await pool.query(`
        ALTER TABLE trips ADD COLUMN expected_completion_time TIMESTAMP
      `);
      console.log("Column added successfully.");
    } else {
      console.log("Column already exists.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}

migrate();
