// src/services/otp.service.js

const admin = require("../config/firebase");
const OTP = require("../models/OTP");
const logger = require("../utils/logger");

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to mobile number
 * @param {string} mobileNumber - Mobile number to send OTP
 * @returns {Promise<Object>} - Result object with OTP and sessionId
 */
exports.sendOtp = async (mobileNumber) => {
  try {
    // Validate mobile number format
    const cleanNumber = mobileNumber.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      throw new Error("Invalid mobile number format");
    }

    // Check if there's an existing OTP for this number (not expired)
    const existingOtp = await OTP.findOne({
      mobileNumber: cleanNumber,
      expiresAt: { $gt: new Date() },
      isVerified: false,
    });

    // If OTP already sent in last 30 seconds, prevent resend
    if (existingOtp && existingOtp.createdAt) {
      const secondsElapsed = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
      if (secondsElapsed < 30) {
        throw new Error(
          `Please wait ${Math.ceil(30 - secondsElapsed)} seconds before requesting another OTP`
        );
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Format phone number with country code (default +91 for India)
    const formattedNumber = cleanNumber.startsWith("+")
      ? cleanNumber
      : `+91${cleanNumber.slice(-10)}`;

    // Create or update OTP record in database
    const otpRecord = await OTP.findOneAndUpdate(
      { mobileNumber: cleanNumber },
      {
        mobileNumber: cleanNumber,
        formattedNumber,
        otp,
        expiresAt: expiryTime,
        isVerified: false,
        attempts: 0,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info(`OTP generated for mobile: ${cleanNumber}`);
    console.log(`✅ OTP for ${cleanNumber}: ${otp} (Expires: ${expiryTime})`);

    // In production, send via SMS using Firebase, Twilio, AWS SNS, etc.
    // For now, we'll log it for development/testing
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate Twilio or Firebase Cloud Messaging
      // await sendOtpViaSMS(formattedNumber, otp);
    }

    return {
      success: true,
      message: "OTP sent successfully",
      mobileNumber: cleanNumber,
      formattedNumber,
      // In production, don't return OTP to client
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
      expiresAt: expiryTime,
      sessionId: otpRecord._id,
    };
  } catch (error) {
    logger.error(`Error sending OTP: ${error.message}`);
    throw new Error(error.message || "Failed to send OTP");
  }
};

/**
 * Verify OTP
 * @param {string} mobileNumber - Mobile number to verify
 * @param {string} otp - OTP code to verify
 * @returns {Promise<Object>} - Result object with verification status
 */
exports.verifyOtp = async (mobileNumber, otp) => {
  try {
    // Validate inputs
    if (!mobileNumber || !otp) {
      throw new Error("Mobile number and OTP required");
    }

    const cleanNumber = mobileNumber.replace(/\D/g, "");
    const otpString = otp.toString().trim();

    // Check for OTP attempts limit
    const otpRecord = await OTP.findOne({
      mobileNumber: cleanNumber,
    });

    if (!otpRecord) {
      throw new Error("No OTP found for this number. Please request a new OTP.");
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      logger.warn(`OTP expired for mobile: ${cleanNumber}`);
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      logger.warn(`Too many OTP attempts for mobile: ${cleanNumber}`);
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new Error("Too many attempts. Please request a new OTP.");
    }

    // Verify OTP
    if (otpRecord.otp !== otpString) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new Error(
        `Invalid OTP. Attempt ${otpRecord.attempts} of 5. Please try again.`
      );
    }

    // Mark as verified
    otpRecord.isVerified = true;
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    logger.info(`OTP verified successfully for mobile: ${cleanNumber}`);
    console.log(`✅ OTP verified for ${cleanNumber}`);

    return {
      success: true,
      message: "OTP verified successfully",
      mobileNumber: cleanNumber,
      verifiedAt: otpRecord.verifiedAt,
      sessionId: otpRecord._id,
    };
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    throw new Error(error.message || "Failed to verify OTP");
  }
};

/**
 * Get OTP verification status
 * @param {string} mobileNumber - Mobile number
 * @returns {Promise<Object>} - Verification status
 */
exports.getOtpStatus = async (mobileNumber) => {
  try {
    const cleanNumber = mobileNumber.replace(/\D/g, "");
    const otpRecord = await OTP.findOne({ mobileNumber: cleanNumber });

    if (!otpRecord) {
      return {
        isVerified: false,
        message: "No OTP record found",
      };
    }

    return {
      isVerified: otpRecord.isVerified,
      mobileNumber: cleanNumber,
      expiresAt: otpRecord.expiresAt,
      verifiedAt: otpRecord.verifiedAt,
      attempts: otpRecord.attempts,
      createdAt: otpRecord.createdAt,
    };
  } catch (error) {
    logger.error(`Error getting OTP status: ${error.message}`);
    throw new Error(error.message || "Failed to get OTP status");
  }
};

/**
 * Clear OTP for mobile number
 * @param {string} mobileNumber - Mobile number
 */
exports.clearOtp = async (mobileNumber) => {
  try {
    const cleanNumber = mobileNumber.replace(/\D/g, "");
    await OTP.deleteOne({ mobileNumber: cleanNumber });
    logger.info(`OTP cleared for mobile: ${cleanNumber}`);
    return { success: true, message: "OTP cleared" };
  } catch (error) {
    logger.error(`Error clearing OTP: ${error.message}`);
    throw new Error(error.message || "Failed to clear OTP");
  }
};

/**
 * Send OTP via SMS (implementation for Twilio)
 * Placeholder for actual SMS implementation
 */
const sendOtpViaSMS = async (phoneNumber, otp) => {
  try {
    // TODO: Implement Twilio integration
    // const client = require("twilio")(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );
    //
    // await client.messages.create({
    //   body: `Your OTP is: ${otp}. Valid for 5 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });

    logger.info(`SMS sent to ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error sending SMS: ${error.message}`);
    throw error;
  }
};

module.exports = exports;
