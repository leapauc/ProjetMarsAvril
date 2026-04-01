const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM events WHERE is_published = true)::int   AS events,
        (SELECT COUNT(*) FROM users WHERE is_anonymized = false)::int  AS users,
        (SELECT COUNT(*) FROM users WHERE role = 'ORGANIZER' AND is_anonymized = false)::int AS organizers
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
