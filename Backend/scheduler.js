// scheduler.js
const cron = require("node-cron");
const pool = require("./db");
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

// Exporte la fonction pour tests
module.exports = cleanupInactiveUsers;

// Lancer le cron uniquement si on n'est pas en test
if (process.env.NODE_ENV !== "test") {
  cron.schedule(
    "0 3 * * *",
    () => {
      log("⏰ Running scheduled job: cleanup_inactive_users");
      cleanupInactiveUsers();
    },
    {
      timezone: "Europe/Paris",
    },
  );
}
