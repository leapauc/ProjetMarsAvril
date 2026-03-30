// tests/auth.test.js
const request = require("supertest");
const app = require("../app"); // ton fichier app.js
const pool = require("../db");

describe("Auth API", () => {
  const testEmail = "test.login@example.com";
  const testPassword = "password123";
  let testUserId;

  beforeAll(async () => {
    // Nettoyer tout utilisateur test précédent
    await pool.query(
      `DELETE FROM consent_log WHERE id_user IN (
        SELECT id_user FROM users WHERE email = $1
      )`,
      [testEmail],
    );
    await pool.query(`DELETE FROM users WHERE email = $1`, [testEmail]);

    // Créer un utilisateur test
    const result = await pool.query(
      `INSERT INTO users
        (email, password, firstname, lastname, role, consent_date, consent_version, is_anonymized)
       VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5, NOW(), 'v1', FALSE)
       RETURNING id_user`,
      [testEmail, testPassword, "Test", "Login", "USER"],
    );
    testUserId = result.rows[0].id_user;
  });

  afterAll(async () => {
    // Supprimer logs et utilisateur test
    await pool.query("DELETE FROM consent_log WHERE id_user=$1", [testUserId]);
    await pool.query("DELETE FROM users WHERE id_user=$1", [testUserId]);
    await pool.end();
  });

  test("POST /api/auth/login -> connexion réussie", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Connexion réussie");
    expect(res.body.user.email).toBe(testEmail);
  });

  test("POST /api/auth/login -> retourne 401 si mot de passe incorrect", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Email ou mot de passe incorrect");
  });

  test("POST /api/auth/login -> retourne 401 si email inexistant", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: testPassword,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Email ou mot de passe incorrect");
  });

  test("POST /api/auth/login -> retourne 400 si champs manquants", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email et mot de passe requis");
  });
});
