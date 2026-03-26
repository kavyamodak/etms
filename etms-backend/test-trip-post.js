import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api/trips';
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

async function testTripPOST() {
  const token = jwt.sign({ id: 38, role: 'employee' }, JWT_SECRET);
  
  const payload = {
    start_location: 'Marathahalli, Bengaluru',
    end_location: 'Whitefield, Bengaluru',
    scheduled_time: new Date(Date.now() + 3600000).toISOString()
  };

  try {
    console.log("Sending POST to", API_URL);
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", resp.status);
    const data = await resp.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

testTripPOST();
