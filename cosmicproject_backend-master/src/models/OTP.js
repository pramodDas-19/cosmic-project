// src/models/OTP.js

const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    formattedNumber: {
      type: String,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
      length: 6,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      // Auto-delete document after expiration
      expires: 600, // 10 minutes after expiry
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    userData: {
      name: String,
      email: String,
      userId: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding non-verified OtPs
otpSchema.index({ mobileNumber: 1, isVerified: 1 });

// Index for cleanup of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
