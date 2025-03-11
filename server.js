const app = require("./app.js");

// Handling uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to an uncaught exception.");
});

// Load environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
};

// Create server
const server = app.listen(5000, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT || 5000}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to an unhandled promise rejection.");

  server.close(() => {
    process.exit(1);
  });
});
