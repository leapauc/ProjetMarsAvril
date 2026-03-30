// tests/auth.test.js
const request = require("supertest");
const app = require("../app");
const pool = require("../db");

beforeAll(async () => {
  // Supprimer les utilisateurs test existants
  await pool.query(
    `DELETE FROM consent_log WHERE id_user IN (
      SELECT id_user FROM users WHERE email IN ($1, $2)
    )`,
    ["test.auth@example.com", "new.auth@example.com"],
  );
  await pool.query(`DELETE FROM users WHERE email IN ($1, $2)`, [
    "test.auth@example.com",
    "new.auth@example.com",
  ]);

  // Créer un utilisateur test pour login
  await pool.query(
    `INSERT INTO users 
      (email, password, firstname, lastname, role, consent_date, consent_version, is_anonymized)
     VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5, NOW(), 'v1', FALSE)`,
    ["test.auth@example.com", "password123", "Test", "Auth", "USER"],
  );
});

afterAll(async () => {
  // Supprimer les logs puis utilisateurs test
  await pool.query(
    `DELETE FROM consent_log WHERE id_user IN (
      SELECT id_user FROM users WHERE email IN ($1, $2)
    )`,
    ["test.auth@example.com", "new.auth@example.com"],
  );
  await pool.query(`DELETE FROM users WHERE email IN ($1, $2)`, [
    "test.auth@example.com",
    "new.auth@example.com",
  ]);
  await pool.end();
});

describe("Auth API", () => {
  test("POST /api/auth/register -> crée un nouvel utilisateur", async () => {
    const newUser = {
      email: "new.auth@example.com",
      password: "password123",
      firstname: "New",
      lastname: "Auth",
      role: "USER",
      consentVersion: "v1",
    };

    const res = await request(app).post("/api/auth/register").send(newUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Utilisateur créé");
    expect(res.body.user.email).toBe("new.auth@example.com");
  });

  test("POST /api/auth/register -> retourne 400 si email déjà utilisé", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test.auth@example.com",
      password: "password123",
      firstname: "Dup",
      lastname: "Dup",
      consentVersion: "v1",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email déjà utilisé");
  });

  test("POST /api/auth/register -> retourne 400 si champs manquants", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "incomplete@example.com",
      password: "pwd",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Champs obligatoires manquants");
  });

  test("POST /api/auth/login -> connexion réussie", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test.auth@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Connexion réussie");
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("test.auth@example.com");
  });

  test("POST /api/auth/login -> retourne 401 si mot de passe incorrect", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test.auth@example.com",
      password: "wrongpassword",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Email ou mot de passe incorrect");
  });

  test("POST /api/auth/login -> retourne 401 si email inexistant", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Email ou mot de passe incorrect");
  });

  test("POST /api/auth/login -> retourne 400 si champs manquants", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test.auth@example.com",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email et mot de passe requis");
  });
});
