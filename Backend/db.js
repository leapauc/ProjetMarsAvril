const { Pool } = require("pg");
require("dotenv").config();

let pool;

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  // Connexion à Supabase via le client JS
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  console.log("✅ Connected to Supabase via JS client");
} else {
  // Connexion locale
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log("✅ Connected to local db");
}

pool.on("connect", () => {
  console.log("✅ Connected to the database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
