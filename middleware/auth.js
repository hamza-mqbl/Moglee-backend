const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const db = require("../DB/DB"); // Import your MySQL connection pool

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  console.log("🚀 ~ exports.isAuthenticated=catchAsyncErrors ~ token:", token)

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  // Verify the JWT token
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // Fetch the user from MySQL database
  const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [decoded.id]);

  if (users.length === 0) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Attach the user to the request object
  req.user = users[0];
  next();
});