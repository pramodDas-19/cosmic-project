// src/controllers/otp.controller.js

const otpService = require("../services/otp.service");

exports.sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({
        status: "error",
        message: "Invalid mobile number",
      });
    }

    otpService.sendOtp(mobileNumber);

    return res.json({
      status: "success",
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to send OTP",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Mobile number and OTP required",
      });
    }

    const isValid = otpService.verifyOtp(mobileNumber, otp);

    if (!isValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired OTP",
      });
    }

    return res.json({
      status: "success",
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "OTP verification failed",
    });
  }
};
