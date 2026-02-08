const express = require("express");
const { 
  sendOtp, 
  verifyOtp, 
  getOtpStatus, 
  resendOtp 
} = require("../controllers/otp.controller");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

/**
 * Public Routes (No authentication required)
 */

// Send OTP to mobile number
router.post("/send", sendOtp);

// Verify OTP
router.post("/verify", verifyOtp);

// Resend OTP
router.post("/resend", resendOtp);

// Get OTP verification status
router.get("/status", getOtpStatus);

/**
 * Backend endpoints (may need authentication)
 */

// Firebase OTP verification endpoint (existing endpoint for backward compatibility)
const admin = require("../config/firebase");
router.post("/verify-firebase", async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.status(200).json({
      success: true,
      uid: decodedToken.uid,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

module.exports = router;
