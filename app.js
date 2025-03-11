const express = require("express");
const ErrorHandler = require("./middleware/error.js");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(express.json());
app.use(cookieParser());


app.use(cors({
  origin: ["http://localhost:3000","https://moglee-project.vercel.app/"],  // Allow both frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// app.use()
app.use("/", express.static("uploads")); //setup done for 2nd branch
// Increase the payload size limit
app.use(bodyParser.json({ limit: "50mb" })); // Increase limit as needed
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "backend/config/.env",
  });
}

// import routes

const Orders = require("./controller/Orders.js");

app.use("/api/orders", Orders);

app.get("/is", (req, res) => {
  res.send("Server is running!");
});

// it is not for errorhandling
app.use(ErrorHandler);

module.exports = app;
