import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import pool from "../config/db.js";
import dotenv from "dotenv";
import { getFrontendUrl } from "../config/runtimeUrls.js";
import { sendResetEmail, sendOTPEmail } from "../utils/email.js";

dotenv.config();

const router = express.Router();
const validRoles = ["admin", "employee", "driver"];
const frontendUrl = getFrontendUrl();

const normalizeRole = (role) => {
  if (!role) return "employee";
  const lower = String(role).toLowerCase();
  if (lower === "user") return "employee";
  return validRoles.includes(lower) ? lower : "employee";
};

/* =======================
   GOOGLE LOGIN
======================= */
router.get(
  "/google",
  (req, res, next) => {
    const requestedRole = req.query.role || "employee";
    const intent = req.query.intent || "login";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: JSON.stringify({ role: requestedRole, intent })
    })(req, res, next);
  }
);

/* GOOGLE CALLBACK */
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, async (err, user, info) => {
      let intent = "login";
      try {
        if (req.query.state) {
          const parsed = JSON.parse(req.query.state);
          intent = parsed.intent || "login";
        }
      } catch (e) { }

      if (err) {
        console.error("Google Auth Error during callback:", err);
        if (!frontendUrl) {
          return res.status(500).json({ error: "FRONTEND_URL is not configured on the backend" });
        }
        const errDest = intent === "signup" ? "/signup" : "/login";
        return res.redirect(`${frontendUrl}${errDest}?error=oauth_error&message=${encodeURIComponent(err.message)}`);
      }
      if (!user) {
        if (!frontendUrl) {
          return res.status(500).json({ error: "FRONTEND_URL is not configured on the backend" });
        }
        const msg = info && info.message ? info.message : "google_failed";
        const errDest = intent === "signup" ? "/signup" : "/login";
        return res.redirect(`${frontendUrl}${errDest}?error=email_exists&message=${encodeURIComponent(msg)}`);
      }

      req.user = user;
      const normalizedRole = normalizeRole(req.user.role);

      if (normalizedRole !== req.user.role) {
        try {
          const updated = await pool.query(
            "UPDATE users SET role=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *",
            [normalizedRole, req.user.id]
          );
          req.user = updated.rows[0];
        } catch (dbErr) {
          console.error("Google callback role normalization error:", dbErr.message);
          return res.status(500).json({ error: "Server error" });
        }
      }

      const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
      const token = jwt.sign(
        { id: req.user.id, role: req.user.role, full_name: req.user.full_name },
        jwtSecret,
        { expiresIn: "1d" }
      );

      // We explicitly track if they were newly created via our Passport strategy's _isNew flag hack
      const isSignupFlow = req.user._isNew ? "1" : "0";

      if (!frontendUrl) {
        return res.status(500).json({ error: "FRONTEND_URL is not configured on the backend" });
      }

      const redirectUrl = `${frontendUrl}/login?token=${encodeURIComponent(token)}&role=${encodeURIComponent(req.user.role)}&email=${encodeURIComponent(req.user.email)}&isNew=${isSignupFlow}`;
      res.redirect(redirectUrl);
    })(req, res, next);
  }
);

/* GOOGLE SIGNUP - UPDATE ROLE AFTER GOOGLE LOGIN */
router.post("/google-role", async (req, res) => {
  const { email, role } = req.body;

  // Validate role
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'admin', 'employee', or 'driver'" });
  }

  try {
    // Update user role in database
    const result = await pool.query(
      "UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING *",
      [role, email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role, message: "Role updated successfully" });
  } catch (err) {
    console.error("Google role update error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   CHECK EMAIL EXISTS
======================= */
router.post("/check-email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const result = await pool.query("SELECT id FROM users WHERE email=$1", [email.toLowerCase()]);
    return res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error("Check email error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   EMAIL SIGNUP
======================= */
router.post("/signup", async (req, res) => {
  const { fullName, email, phone, password, role } = req.body;
  const normalizedRole = normalizeRole(role);

  // Validate role
  if (!role || !validRoles.includes(String(role).toLowerCase())) {
    return res.status(400).json({ error: "Invalid role. Must be 'admin', 'employee', or 'driver'" });
  }

  // Validate required fields
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "fullName, email, and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // 1️⃣ Check if email already exists
    const existingUser = await pool.query(
      "SELECT id, is_verified FROM users WHERE email=$1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.is_verified) {
        return res.status(400).json({ error: "Email already registered" });
      } else {
        // User exists but is NOT verified! Resend the OTP so the UI can continue smoothly.
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60000);
        const hashed = await bcrypt.hash(password, 10);

        await pool.query(
          "UPDATE users SET otp=$1, otp_expires_at=$2, password_hash=$3 WHERE id=$4",
          [otp, otpExpiresAt, hashed, user.id]
        );
        const emailSent = await sendOTPEmail(email.toLowerCase(), otp);
        if (!emailSent) {
          return res.status(503).json({
            error: "Unable to generate verification OTP right now. Please try again shortly.",
          });
        }

        return res.status(201).json({
          message: "OTP generated. Check backend terminal logs.",
          requiresOTP: true,
          email: email.toLowerCase(),
        });
      }
    }

    // 2️⃣ Hash the password
    const hashed = await bcrypt.hash(password, 10);

    // 3️⃣ Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    // 4️⃣ Insert user into database (UNVERIFIED)
    const userResult = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_verified, otp, otp_expires_at)
       VALUES ($1, $2, $3, $4, $5, false, $6, $7)
       RETURNING id, email, role, full_name, phone`,
      [fullName, email.toLowerCase(), phone || null, hashed, normalizedRole, otp, otpExpiresAt]
    );

    const newUser = userResult.rows[0];

    // 5️⃣ Create role-specific records
    if (normalizedRole === 'user') {
      await pool.query(
        `INSERT INTO employees (user_id, employee_id)
         VALUES ($1, $2)`,
        [newUser.id, `EMP-${newUser.id}-${Date.now()}`]
      );
    } else if (normalizedRole === 'driver') {
      await pool.query(
        `INSERT INTO drivers (user_id, license_number, status, is_active)
         VALUES ($1, $2, 'active', true)`,
        [newUser.id, `LICENSE-${newUser.id}-${Date.now()}`]
      );
    }

    // 6️⃣ Send out the OTP email (async)
    const emailSent = await sendOTPEmail(newUser.email, otp);
    if (!emailSent) {
      await pool.query("DELETE FROM users WHERE id = $1", [newUser.id]);
      return res.status(503).json({
        error: "Unable to generate verification OTP right now. Please try again.",
      });
    }

    // Note: Do NOT generate/return JWT yet. Force the verification step.
    return res.status(201).json({
      message: "User created successfully. OTP generated in backend terminal logs.",
      requiresOTP: true,
      email: newUser.email,
    });
  } catch (err) {
    console.error("Signup error:", err);

    // PostgreSQL unique constraint violation
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already registered" });
    }

    return res.status(500).json({
      error: "Server error",
      detail: err?.message,
      code: err?.code,
    });
  }
});

/* =======================
   EMAIL LOGIN
======================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email.toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if the user has verified their email yet.
    if (user.is_verified === false) {
      // Re-generate and resend OTP just in case they lost it
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60000);
      await pool.query("UPDATE users SET otp=$1, otp_expires_at=$2 WHERE id=$3", [otp, otpExpiresAt, user.id]);
      const emailSent = await sendOTPEmail(user.email, otp);
      if (!emailSent) {
        return res.status(503).json({
          error: "Unable to generate verification OTP right now. Please try again shortly.",
        });
      }

      return res.status(403).json({
        error: "Email not verified",
        requiresOTP: true,
        email: user.email
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      jwtSecret,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   VERIFY OTP
======================= */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email.toLowerCase()]);
    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: "User is already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP has expired. Please log in to request a new one." });
    }

    // Success! Mark as verified and clear OTP
    await pool.query(
      "UPDATE users SET is_verified=true, otp=NULL, otp_expires_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
      [user.id]
    );

    // Issue Token
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Email verified successfully",
      token,
      role: user.role,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error("OTP Verification Error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   FORGOT PASSWORD
======================= */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  console.log(`\n[Forgot Password] Received request for: ${email}`);

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email.toLowerCase()]);

    if (!result.rows.length) {
      console.log(`[Forgot Password] Email ${email} not found in database.`);
      // Don't reveal that the user does not exist
      return res.json({ message: "If this email is registered, a reset link will be sent." });
    }

    const user = result.rows[0];
    console.log(`[Forgot Password] Found user! Generating reset link for ${user.email}...`);

    // Create a special JWT for reset password. Incorporating the password hash makes it one-time usage!
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const secret = jwtSecret + user.password_hash;

    const token = jwt.sign(
      { id: user.id, email: user.email },
      secret,
      { expiresIn: "15m" }
    );

    // Generate the reset link in backend terminal logs.
    const resetEmailSent = await sendResetEmail(user.email, token);
    if (!resetEmailSent) {
      return res.status(503).json({
        error: "Unable to generate reset link right now. Please try again shortly."
      });
    }

    return res.json({ message: "If this email is registered, a reset link will be sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   RESET PASSWORD
======================= */
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Invalid request or password too short" });
  }

  try {
    // Decode token to get ID without verifying signature yet to fetch the user's password_hash
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id=$1", [decoded.id]);
    if (!result.rows.length) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const user = result.rows[0];
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const secret = jwtSecret + user.password_hash;

    // Verify token strictly
    jwt.verify(token, secret);

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query("UPDATE users SET password_hash=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [hashed, user.id]);

    return res.json({ message: "Password has been successfully reset" });

  } catch (err) {
    console.error("Reset password error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Token has expired" });
    }
    return res.status(400).json({ error: "Invalid or expired token" });
  }
});

export default router;
