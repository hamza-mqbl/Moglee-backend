const jwt = require("jsonwebtoken");

const sendToken = (userId, statuscode, res) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "5h",
  });

  // Options for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Required for HTTPS
    sameSite: "None", // Important for cross-origin cookies
  };

  res.status(statuscode).cookie("token", token, options).json({
    success: true,
    token,
  });
};

module.exports = sendToken;
