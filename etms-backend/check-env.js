import dotenv from 'dotenv';
dotenv.config();

console.log("GOOGLE_MAPS_API_KEY:", process.env.GOOGLE_MAPS_API_KEY ? "PRESENT" : "MISSING");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "PRESENT" : "MISSING");
console.log("DB_NAME:", process.env.DB_NAME);
