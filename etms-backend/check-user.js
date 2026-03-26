import pool from './config/db.js';

async function checkUserMapping() {
  try {
    const userRes = await pool.query("SELECT id, email, role FROM users WHERE email = 'desaishreya@gmail.com'");
    console.log("User Info:", userRes.rows[0]);
    
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      const empRes = await pool.query("SELECT * FROM employees WHERE user_id = $1", [userId]);
      console.log("Employee Info for user_id " + userId + ":", empRes.rows[0]);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("DB Error:", err.message);
    process.exit(1);
  }
}

checkUserMapping();
