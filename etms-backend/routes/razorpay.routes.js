import express from 'express';
import { createOrder, verifyPayment } from '../controllers/razorpayController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
};

router.post('/order', verifyToken, createOrder);
router.post('/verify', verifyToken, verifyPayment);

export default router;
