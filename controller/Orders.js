const express = require("express");
const router = express.Router();
const db = require("../DB/DB");

router.get("/get-dispatch-backlog", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM dispatchBacklog");
    res.json(results);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: err.message });
  }
});
// /api/orders/test-db-connection
router.get("/test-db-connection", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({ message: "Database connection successful", result: rows[0].result });
  } catch (err) {
    console.error("Error testing database connection:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});
router.get("/get-backlog_reasons", async (req, res) => {
  console.log("request is coming", req.body);
  db.query("SELECT * FROM backlog_reasons", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

router.put("/update-backlog-reason", async (req, res) => {
  const { order_id, backlog_reason_id, backlog_reason_desc, backlog_comment } =
    req.body;
  console.log("🚀 ~ router.put ~ req.body:", req.body);

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

    const [result] = await db.promise().query(sql, values);

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
