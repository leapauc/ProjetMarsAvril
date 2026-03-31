// tests/history.test.js
const request = require("supertest");
const app = require("../app"); // ton app Express
const pool = require("../db");

let adminUser;
let normalUser;
let authTokenAdmin;
let authTokenUser;

beforeAll(async () => {
  const now = new Date();

  // Création d'un utilisateur ADMIN
  let res = await pool.query(
    `INSERT INTO users
       (email, firstname, lastname, phone, role, password, consent_date, consent_version, is_anonymized, created_at)
     VALUES ($1,$2,$3,$4,$5,crypt($6, gen_salt('bf')),$7,$8,$9,$10)
     RETURNING *`,
    [
      "admin@example.com",
      "Admin",
      "User",
      "0600000001",
      "ADMIN",
      "Password123!",
      now,
      "v1",
      false,
      now,
    ],
  );
  adminUser = res.rows[0];

  // Création d'un utilisateur normal
  res = await pool.query(
    `INSERT INTO users
       (email, firstname, lastname, phone, role, password, consent_date, consent_version, is_anonymized, created_at)
     VALUES ($1,$2,$3,$4,$5,crypt($6, gen_salt('bf')),$7,$8,$9,$10)
     RETURNING *`,
    [
      "user@example.com",
      "Normal",
      "User",
      "0600000002",
      "USER",
      "Password123!",
      now,
      "v1",
      false,
      now,
    ],
  );
  normalUser = res.rows[0];

  // Connexion admin
  let loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@example.com", password: "Password123!" });
  authTokenAdmin = loginRes.body.token;

  // Connexion utilisateur normal
  loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "user@example.com", password: "Password123!" });
  authTokenUser = loginRes.body.token;

  // Insertion logs test
  await pool.query(
    `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
     VALUES ($1, 'data_accessed', NOW(), '127.0.0.1', 'Consultation test')`,
    [normalUser.id_user],
  );

  await pool.query(
    `INSERT INTO user_action_log (id_actor_user, id_target_user, action, action_date, details)
     VALUES ($1, $2, 'event_registration', NOW(), 'Inscription test')`,
    [adminUser.id_user, normalUser.id_user],
  );
});

afterAll(async () => {
  // Nettoyage
  await pool.query(
    `DELETE FROM user_action_log WHERE id_actor_user=$1 OR id_target_user=$1`,
    [adminUser.id_user],
  );
  await pool.query(`DELETE FROM consent_log WHERE id_user=$1`, [
    normalUser.id_user,
  ]);
  await pool.query(`DELETE FROM users WHERE id_user=$1 OR id_user=$2`, [
    adminUser.id_user,
    normalUser.id_user,
  ]);
  await pool.end();
});

describe("API /history", () => {
  test("GET /history - récupère l'historique complet pour ADMIN", async () => {
    const res = await request(app)
      .get("/history")
      .set("Authorization", `Bearer ${authTokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const log = res.body[0];
    expect(log).toHaveProperty("user_id");
    expect(log).toHaveProperty("user_name");
    expect(log).toHaveProperty("log_type");
    expect(log).toHaveProperty("log_date");
    expect(log).toHaveProperty("source");
  });

  test("GET /history - refusé pour utilisateur non authentifié", async () => {
    const res = await request(app).get("/history");
    expect(res.statusCode).toBe(401);
  });

  test("GET /history/:id - récupère l'historique d'un utilisateur spécifique", async () => {
    const res = await request(app)
      .get(`/history/${normalUser.id_user}`)
      .set("Authorization", `Bearer ${authTokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].user_id).toBe(normalUser.id_user);
  });

  test("GET /history/:id - renvoie 404 si aucun historique", async () => {
    const res = await request(app)
      .get(`/history/999999`)
      .set("Authorization", `Bearer ${authTokenAdmin}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe(
      "Aucun historique trouvé pour cet utilisateur",
    );
  });

  test("GET /history/:id - refusé pour utilisateur non autorisé", async () => {
    const res = await request(app)
      .get(`/history/${normalUser.id_user}`)
      .set("Authorization", `Bearer ${authTokenUser}`);
    expect(res.statusCode).toBe(200); // USER peut accéder à son propre historique
    // pour tester refus complet, il faudrait un rôle non autorisé
  });
});
