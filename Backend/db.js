// db.js
require("dotenv").config();
const { Pool } = require("pg");

let pool;
let supabase;

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  // Utilisation du client Supabase JS
  const { createClient } = require("@supabase/supabase-js"); // <-- important !
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  console.log("✅ Connected to Supabase via JS client");
} else {
  // Connexion locale PostgreSQL
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  pool.on("connect", () => console.log("✅ Connected to local db"));
  pool.on("error", (err) => {
    console.error("❌ Unexpected error on idle client", err);
    process.exit(-1);
  });
}

module.exports = { pool, supabase };
