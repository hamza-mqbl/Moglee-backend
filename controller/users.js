const express = require("express");
const router = express.Router();
const db = require("../DB/DB"); // Assuming you have a MySQL connection pool set up in this file
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");
const { isAuthenticated } = require("../middleware/auth.js");
const cloudinary = require("cloudinary").v2;
const sendMail = require("../utils/sendMail.js");
const sendToken = require("../utils/sendToken.js");
// const { upload } = require("../multer.js");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post("/create-user", upload.single("avatar"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log("🚀 ~ router.post ~ req.body:", req.body);

    // Check if the user already exists
    const [existingUser] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return next(new ErrorHandler("User already exists", 400));
    }

    let avatarResult = null;

    // Upload avatar to Cloudinary if provided
    if (req.file) {
      console.log("🚀 ~ router.post ~ req.file:", req.file);
      try {
        avatarResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "avatars" },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                return reject(new ErrorHandler(error.message, 500));
              }
              console.log("Cloudinary upload result:", result);
              resolve(result);
            }
          );
          uploadStream.end(req.file.buffer); // End the stream with the file buffer
        });
      } catch (error) {
        return next(new ErrorHandler("Image upload failed", 500));
      }
    }

    // Hash the password before sending it in the activation token
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data for the activation token
    const user = {
      name,
      email,
      password: hashedPassword, // Use hashed password
      avatar: avatarResult
        ? { public_id: avatarResult.public_id, url: avatarResult.secure_url }
        : null, // Ensure avatar is stored properly
    };

    // Generate activation token
    const activationToken = createActivationToken(user);
    const activationUrl = `https://moglee-backend.vercel.app/api/user/activation/${activationToken}`;

    // Send activation email
    try {
      await sendMail({
        email,
        subject: "Activate your account",
        message: `Hello ${name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `Please check your email: ${email} to activate your account!`,
      });
    } catch (error) {
      console.log("🚀 ~ router.post ~ error:", error);
      return next(new ErrorHandler("Sending activation email failed", 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

const createActivationToken = (user) => {
  console.log("🚀 ~ createActivationToken ~ user:", user);
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    password: user.password, // Include the hashed password
    avatar: user.avatar, // Ensure avatar is always present
  };
  return jwt.sign(payload, process.env.ACTIVATION_SECRET, {
    expiresIn: "1h",
  });
};
// activation route
// Activation route (FIXED)
router.get("/activation/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    console.log("🚀 ~ router.get ~ token:", token);

    // Verify the activation token
    const decoded = jwt.verify(token, process.env.ACTIVATION_SECRET);
    console.log("🚀 ~ router.get ~ decoded:", decoded);

    const { name, email, password, avatar } = decoded; // password is already hashed!

    // Check if the user already exists
    const [existingUser] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return next(new ErrorHandler("User already exists", 400));
    }

    // Store the hashed password directly (DO NOT rehash it)
    const avatarValue = avatar ? JSON.stringify(avatar) : null;

    // Save the user in the database
    await db.execute(
      "INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)",
      [name, email, password, avatarValue] // Directly store password (already hashed)
    );

    res.status(200).json({
      success: true,
      message: "Account activated successfully! You can now log in.",
    });
  } catch (error) {
    console.log("🚀 ~ Activation Error:", error);
    return next(new ErrorHandler("Invalid or expired activation token", 400));
  }
});

// Login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      console.log("🚀 ~ catchAsyncErrors ~ email, password:", email, password);
      if (!email || !password) {
        return next(new ErrorHandler("Please provide all fields!", 400));
      }

      const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (users.length === 0) {
        return next(new ErrorHandler("User doesn't exist!", 400));
      }

      const user = users[0];
      console.log(user.password);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return next(new ErrorHandler("Password is wrong", 400));
      }

      sendToken(user.id, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    console.log("hitting");
    try {
      const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [
        req.user.id,
      ]);
      if (users.length === 0) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }

      const user = users[0];
      console.log("🚀 ~ catchAsyncErrors ~ user:", user);
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Logout user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      console.log("🚀 ~ catchAsyncErrors ~ req.body:", req.body);

      const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (users.length === 0) {
        return next(new ErrorHandler("User not found", 400));
      }

      const user = users[0];

      await db.execute("UPDATE users SET name = ?, email = ? WHERE id = ?", [
        name,
        email,
        user.id,
      ]);

      // Fetch updated user data
      const [updatedUser] = await db.execute("SELECT * FROM users WHERE id = ?", [
        user.id,
      ]);

      res.status(201).json({
        success: true,
        user: updatedUser[0], // Send the updated user
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// Update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  upload.single("avatar"),
  catchAsyncErrors(async (req, res, next) => {
    console.log("File received:", req.file); // Confirm the file is received

    try {
      // Fetch the user from MySQL
      const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [
        req.user.id,
      ]);
      if (users.length === 0) {
        return next(new ErrorHandler("User not found", 400));
      }
      const user = users[0];

      let avatarResult;
      if (req.file) {
        try {
          // Upload the new avatar to Cloudinary
          avatarResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "avatars",
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary upload error:", error);
                  return reject(new ErrorHandler(error.message, 500));
                }
                console.log("Cloudinary upload result:", result);
                resolve(result);
              }
            );

            uploadStream.end(req.file.buffer); // End the stream with the file buffer
          });

          // // Optionally delete the old avatar from Cloudinary
          // if (user.avatar) {
          //   const oldAvatar = JSON.parse(user.avatar);
          //   if (oldAvatar.public_id) {
          //     await cloudinary.uploader.destroy(oldAvatar.public_id);
          //   }
          // }
        } catch (error) {
          return next(new ErrorHandler("Image upload failed", 500));
        }
      }
      console.log("🚀 ~ catchAsyncErrors ~ avatarResult:", avatarResult)

      // Update the user's avatar with the new Cloudinary result in MySQL
      await db.execute("UPDATE users SET avatar = ? WHERE id = ?", [
        JSON.stringify({
          public_id: avatarResult.public_id,
          url: avatarResult.secure_url,
        }),
        user.id,
      ]);

      res.status(200).json({
        success: true,
        message: "Avatar updated successfully!",
        avatar: {
          public_id: avatarResult.public_id,
          url: avatarResult.secure_url,
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    console.log(req.body);
    try {
      const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [
        req.user.id,
      ]);
      if (users.length === 0) {
        return next(new ErrorHandler("User not found", 400));
      }

      const user = users[0];
      const isPasswordMatched = await bcrypt.compare(
        req.body.oldPassword,
        user.password
      );
      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
      await db.execute("UPDATE users SET password = ? WHERE id = ?", [
        hashedPassword,
        user.id,
      ]);

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get user info by ID
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [
        req.params.id,
      ]);
      if (users.length === 0) {
        return next(new ErrorHandler("User not found", 400));
      }

      const user = users[0];
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
