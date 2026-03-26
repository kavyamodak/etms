import { Pool } from 'pg';

const pool = new Pool({
  user: 'etms',
  host: 'localhost',
  database: 'etms',
  password: 'aaku28',
  port: 5432,
});

async function insertSampleFeedback() {
  try {
    // First, let's check if we have trips to reference
    const tripsResult = await pool.query('SELECT id, employee_id FROM trips LIMIT 5');
    
    if (tripsResult.rows.length === 0) {
      console.log('No trips found. Please create some trips first.');
      return;
    }

    // Get user_id from employee_id
    const employeeIds = tripsResult.rows.map(trip => trip.employee_id).filter(Boolean);
    let userId = 1; // Default user ID
    
    if (employeeIds.length > 0) {
      const userResult = await pool.query('SELECT user_id FROM employees WHERE id = $1 LIMIT 1', [employeeIds[0]]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].user_id;
      }
    }

    const sampleFeedback = [
      {
        trip_id: tripsResult.rows[0].id,
        feedback_type: 'complaint',
        message: 'Vehicle was dirty and driver was late',
        rating: 2,
      },
      {
        trip_id: tripsResult.rows[1]?.id || tripsResult.rows[0].id,
        feedback_type: 'appreciation',
        message: 'Excellent service! Driver was very professional',
        rating: 5,
      },
      {
        trip_id: tripsResult.rows[2]?.id || tripsResult.rows[0].id,
        feedback_type: 'suggestion',
        message: 'Please add more stops on this route',
        rating: 4,
      },
    ];

    for (const feedback of sampleFeedback) {
      await pool.query(
        'INSERT INTO feedback (trip_id, user_id, feedback_type, message, rating) VALUES ($1, $2, $3, $4, $5)',
        [feedback.trip_id, userId, feedback.feedback_type, feedback.message, feedback.rating]
      );
    }

    console.log('Sample feedback data inserted successfully!');
  } catch (error) {
    console.error('Error inserting sample feedback:', error);
  } finally {
    await pool.end();
  }
}

insertSampleFeedback();
