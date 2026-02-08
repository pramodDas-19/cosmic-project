// src/services/sms.service.js

const logger = require("../utils/logger");

/**
 * Initialize Twilio client if credentials are available
 */
let twilioClient = null;
let isTwilioConfigured = false;

const initializeTwilio = () => {
  if (isTwilioConfigured) return;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    logger.warn("⚠️ Twilio credentials not configured. SMS sending disabled.");
    logger.warn("Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment variables.");
    isTwilioConfigured = true; // Mark as attempted to prevent repeated logs
    return;
  }

  try {
    const twilio = require("twilio");
    twilioClient = twilio(accountSid, authToken);
    isTwilioConfigured = true;
    logger.info("✅ Twilio SMS service initialized successfully");
  } catch (error) {
    logger.error("❌ Failed to initialize Twilio:", error.message);
    isTwilioConfigured = true;
  }
};

/**
 * Send OTP via SMS using Twilio
 * @param {string} phoneNumber - Phone number in format +91xxxxxxxxxx or 10-digit
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} - Result object
 */
exports.sendOTP = async (phoneNumber, otp) => {
  try {
    // Ensure Twilio is initialized
    if (!twilioClient) {
      initializeTwilio();
    }

    // If Twilio is not configured, log and return success (for development)
    if (!twilioClient) {
      logger.info(`📱 [DEV MODE] OTP would be sent to ${phoneNumber}: ${otp}`);
      return {
        success: true,
        message: "OTP ready (Twilio not configured - dev mode)",
        smsId: "dev-mode",
        phoneNumber,
      };
    }

    // Get Twilio phone number
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!twilioPhoneNumber) {
      logger.warn("⚠️ TWILIO_PHONE_NUMBER not configured");
      return {
        success: false,
        message: "SMS service misconfigured: No sender phone number",
      };
    }

    // Format message
    const message = `Your OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;

    // Send SMS via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      to: phoneNumber, // Recipient's phone number
      from: twilioPhoneNumber, // Your Twilio phone number
    });

    logger.info(`✅ SMS sent successfully to ${phoneNumber} (SID: ${result.sid})`);
    return {
      success: true,
      message: "OTP sent successfully via SMS",
      smsId: result.sid,
      phoneNumber,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error(`❌ Failed to send SMS to ${phoneNumber}:`, error.message);
    return {
      success: false,
      message: `Failed to send SMS: ${error.message}`,
      error: error.message,
    };
  }
};

/**
 * Send generic SMS message
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Result object
 */
exports.sendMessage = async (phoneNumber, message) => {
  try {
    // Ensure Twilio is initialized
    if (!twilioClient) {
      initializeTwilio();
    }

    // If Twilio is not configured
    if (!twilioClient) {
      logger.info(`📱 [DEV MODE] Message would be sent to ${phoneNumber}: ${message}`);
      return {
        success: true,
        message: "Message ready (Twilio not configured - dev mode)",
        smsId: "dev-mode",
        phoneNumber,
      };
    }

    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!twilioPhoneNumber) {
      logger.warn("⚠️ TWILIO_PHONE_NUMBER not configured");
      return {
        success: false,
        message: "SMS service misconfigured",
      };
    }

    const result = await twilioClient.messages.create({
      body: message,
      to: phoneNumber,
      from: twilioPhoneNumber,
    });

    logger.info(`✅ SMS sent successfully (SID: ${result.sid})`);
    return {
      success: true,
      message: "Message sent successfully",
      smsId: result.sid,
      phoneNumber,
    };
  } catch (error) {
    logger.error(`❌ Failed to send message:`, error.message);
    return {
      success: false,
      message: `Failed to send message: ${error.message}`,
    };
  }
};

/**
 * Get SMS service status
 * @returns {Object} - Status object
 */
exports.getStatus = () => {
  initializeTwilio();
  
  return {
    configured: !!twilioClient,
    hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "Not set",
  };
};

// Initialize on module load
initializeTwilio();

module.exports = exports;
