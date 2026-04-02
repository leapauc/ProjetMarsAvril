// db.js
const { Pool } = require("pg");
require("dotenv").config();

let pool;

// Render PostgreSQL fournit DATABASE_URL avec tout ce qu'il faut
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // requis sur Render
    },
  });
  console.log("✅ Connected using Render PostgreSQL DATABASE_URL");
} else {
  // Dev local
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log("✅ Connected using local database configuration");
}

pool.on("connect", () => console.log("✅ Connected to PostgreSQL"));
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
