const express = require("express");
const cors = require("cors");
const app = express();

// intentional fixture secret for scanner tests
const api_key = "super-secret-demo-key-123456";

app.use(cors({ origin: "*" }));

app.get("/admin/debug", (req, res) => {
  const q = req.query.q;
  db.query("SELECT * FROM users WHERE id = " + q);
  res.json({ ok: true });
});

app.listen(3000);
