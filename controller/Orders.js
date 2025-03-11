const express = require("express");
const router = express.Router();
const db = require("../DB/DB");

// Get dispatch backlog
router.get("/get-dispatch-backlog", async (req, res) => {
  console.log("Request for dispatch backlog received");
  try {
    const [results] = await db.query("SELECT * FROM dispatchBacklog");
    res.json(results);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: err.message });
  }
});

// Test database connection
router.get("/test-db-connection", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.json({ message: "Database connection successful", result: rows[0].result });
  } catch (err) {
    console.error("Error testing database connection:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Get backlog reasons
router.get("/get-backlog_reasons", async (req, res) => {
  console.log("Request for backlog reasons received");
  try {
    const [results] = await db.query("SELECT * FROM backlog_reasons");
    res.json(results);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update backlog reason
router.put("/update-backlog-reason", async (req, res) => {
  const { order_id, backlog_reason_id, backlog_reason_desc, backlog_comment } = req.body;
  console.log("Request to update backlog reason:", req.body);

  // Validate inputs
  if (!order_id || !backlog_reason_id || !backlog_comment) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    const sql = `
      UPDATE shopify_orders 
      SET backlog_reason_id = ?, backlog_reason_desc = ?
      WHERE order_id = ?
    `;
    const values = [backlog_reason_id, backlog_comment, order_id];

    const [result] = await db.query(sql, values);

    // Check if the order was updated
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;