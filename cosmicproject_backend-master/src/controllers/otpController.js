const admin = require("../config/firebase");

exports.verifyOtp = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.status(200).json({
      success: true,
      uid: decodedToken.uid,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid OTP" });
  }
};
