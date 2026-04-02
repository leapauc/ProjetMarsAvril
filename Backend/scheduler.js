// scheduler.js
const cron = require("node-cron");
const pool = require("./db"); // ton db.js
const log = console.log;

// Fonction de cleanup
async function cleanupInactiveUsers() {
  try {
    const result = await pool.query("SELECT cleanup_inactive_users();");
    log("✅ cleanup_inactive_users executed", result.rows);
  } catch (err) {
    console.error("❌ Error during cleanup_inactive_users:", err);
  }
}

// Planification : tous les jours à 03:00
cron.schedule(
  "0 3 * * *",
  () => {
    log("⏰ Running scheduled job: cleanup_inactive_users");
    cleanupInactiveUsers();
  },
  {
    timezone: "Europe/Paris", // ou la timezone de ton choix
  },
);

module.exports = cleanupInactiveUsers;
