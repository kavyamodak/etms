import pool from './config/db.js';

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergencies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        trip_id INTEGER REFERENCES trips(id),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Emergencies table created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create emergencies table:", err.message);
    process.exit(1);
  }
}

createTable();
