const request = require("supertest");
const app = require("../app");
const pool = require("../db");

let testEmail = "auth@test.com";

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  await pool.end();
});

describe("Auth API Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("devrait créer un utilisateur", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: testEmail,
        password: "password123",
        firstname: "John",
        lastname: "Doe",
        consentVersion: "1.0",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Utilisateur créé");
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it("devrait refuser si champs manquants", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test2@test.com",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Champs obligatoires manquants");
    });

    it("devrait refuser si email déjà utilisé", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: testEmail,
        password: "password123",
        firstname: "John",
        lastname: "Doe",
        consentVersion: "1.0",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Email déjà utilisé");
    });
  });

  describe("POST /api/auth/login", () => {
    it("devrait connecter un utilisateur", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Connexion réussie");
      expect(res.body.token).toBeDefined();
    });

    it("devrait refuser si mauvais mot de passe", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Email ou mot de passe incorrect");
    });

    it("devrait refuser si champs manquants", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Email et mot de passe requis");
    });
  });
});
