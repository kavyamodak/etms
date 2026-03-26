import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js";
import dotenv from "dotenv";

dotenv.config();

console.log("passport loaded");

const normalizeRole = (role) => {
  const validRoles = ["admin", "employee", "driver"];
  return validRoles.includes(role) ? role : "employee";
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let requestedRole = "employee";
        let intent = "login";
        try {
          const parsed = JSON.parse(req.query.state);
          requestedRole = normalizeRole(parsed.role || "employee");
          intent = parsed.intent || "login";
        } catch (e) {
          requestedRole = normalizeRole(req.query.state || "employee");
        }

        const existing = await pool.query(
          "SELECT * FROM users WHERE email=$1",
          [email]
        );

        if (existing.rows.length) {
          if (intent === "signup") {
            return done(null, false, { message: "Google account already in use" });
          }

          const existingUser = existing.rows[0];
          const normalizedRole = normalizeRole(existingUser.role);

          if (normalizedRole !== existingUser.role) {
            const updated = await pool.query(
              "UPDATE users SET role=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *",
              [normalizedRole, existingUser.id]
            );
            return done(null, updated.rows[0]);
          }

          return done(null, existingUser);
        }

        const result = await pool.query(
          `INSERT INTO users (full_name, email, role, password_hash)
           VALUES ($1, $2, $3, 'GOOGLE_AUTH')
           RETURNING *`,
          [name, email, requestedRole]
        );

        const newUser = result.rows[0];
        newUser._isNew = true;
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
