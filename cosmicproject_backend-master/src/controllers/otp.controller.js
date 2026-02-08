// src/controllers/otp.controller.js

const otpService = require("../services/otp.service");
const logger = require("../utils/logger");

/**
 * Send OTP to mobile number
 */
exports.sendOtp = async (req, res) => {
  try {
    const { mobileNumber, name, email } = req.body;

    if (!mobileNumber || mobileNumber.replace(/\D/g, "").length < 10) {
      return res.status(400).json({
        status: "error",
        message: "Invalid mobile number. Please provide a valid 10-digit number.",
      });
    }

    const result = await otpService.sendOtp(mobileNumber);

    logger.info(`OTP sent to: ${mobileNumber}`);

    return res.status(200).json({
      status: "success",
      message: "OTP sent successfully. Please check your SMS.",
      data: {
        mobileNumber: result.mobileNumber,
        formattedNumber: result.formattedNumber,
        expiresAt: result.expiresAt,
        sessionId: result.sessionId,
        // Only return OTP in development
        otp: process.env.NODE_ENV === "development" ? result.otp : undefined,
      },
    });
  } catch (error) {
    logger.error(`Error sending OTP: ${error.message}`);
    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to send OTP",
    });
  }
};

/**
 * Verify OTP
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Mobile number and OTP are required",
      });
    }

    const result = await otpService.verifyOtp(mobileNumber, otp);

    logger.info(`OTP verified for: ${mobileNumber}`);

    return res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
      data: {
        mobileNumber: result.mobileNumber,
        verifiedAt: result.verifiedAt,
        sessionId: result.sessionId,
      },
    });
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    return res.status(400).json({
      status: "error",
      message: error.message || "OTP verification failed",
    });
  }
};

/**
 * Get OTP status
 */
exports.getOtpStatus = async (req, res) => {
  try {
    const { mobileNumber } = req.query;

    if (!mobileNumber) {
      return res.status(400).json({
        status: "error",
        message: "Mobile number is required",
      });
    }

    const result = await otpService.getOtpStatus(mobileNumber);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(`Error getting OTP status: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to get OTP status",
    });
  }
};

/**
 * Resend OTP
 */
exports.resendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || mobileNumber.replace(/\D/g, "").length < 10) {
      return res.status(400).json({
        status: "error",
        message: "Invalid mobile number",
      });
    }

    // Clear existing OTP first
    await otpService.clearOtp(mobileNumber);

    // Send new OTP
    const result = await otpService.sendOtp(mobileNumber);

    logger.info(`OTP resent to: ${mobileNumber}`);

    return res.status(200).json({
      status: "success",
      message: "OTP resent successfully",
      data: {
        mobileNumber: result.mobileNumber,
        expiresAt: result.expiresAt,
        sessionId: result.sessionId,
        otp: process.env.NODE_ENV === "development" ? result.otp : undefined,
      },
    });
  } catch (error) {
    logger.error(`Error resending OTP: ${error.message}`);
    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to resend OTP",
    });
  }
};
