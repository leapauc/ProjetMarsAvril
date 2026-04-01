require("dotenv").config();
const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Tokens
let adminToken;
let userToken;

// Fonction utilitaire pour générer des emails uniques
const randomEmail = () =>
  `testuser${Math.floor(Math.random() * 100000)}@mail.com`;

describe("User API Endpoints", () => {
  let createdUserId = null;

  // Génération des tokens avant tous les tests
  beforeAll(() => {
    adminToken = jwt.sign(
      { id: 1, email: "admin@test.com", role: "ADMIN" },
      process.env.JWT_SECRET,
    );
    userToken = jwt.sign(
      { id: 2, email: "user@test.com", role: "USER" },
      process.env.JWT_SECRET,
    );
  });

  // Nettoyage avant tous les tests pour éviter conflits emails
  beforeAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE 'testuser%@mail.com'");
  });

  // Réinitialisation avant chaque test
  beforeEach(() => {
    createdUserId = null;
  });

  // Nettoyage après chaque test
  afterEach(async () => {
    if (createdUserId) {
      await pool.query("DELETE FROM users WHERE id_user = $1", [createdUserId]);
      createdUserId = null;
    }
  });

  // Nettoyage après tous les tests
  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE 'testuser%@mail.com'");
    await pool.end();
  });

  // =========================
  // GET /api/user
  // =========================
  describe("GET /api/user", () => {
    it("devrait retourner 401 si pas de token", async () => {
      const res = await request(app).get("/api/user");
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Token manquant");
    });

    it("devrait retourner 403 si rôle non ADMIN", async () => {
      const res = await request(app)
        .get("/api/user")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Accès interdit");
    });

    it("devrait retourner la liste des utilisateurs pour ADMIN", async () => {
      const res = await request(app)
        .get("/api/user")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // =========================
  // POST /api/user
  // =========================
  describe("POST /api/user", () => {
    it("devrait créer un nouvel utilisateur", async () => {
      const email = randomEmail();
      const res = await request(app)
        .post("/api/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email,
          password: "Password123",
          firstname: "Test",
          lastname: "User",
          phone: "0601020304",
          role: "USER",
          consentVersion: "1.0", // ✅ obligatoire
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(email);

      createdUserId = res.body.user.id_user;
    });

    it("devrait renvoyer 400 si email déjà utilisé", async () => {
      const email = randomEmail();
      const preRes = await request(app)
        .post("/api/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email,
          password: "Password123",
          firstname: "Test",
          lastname: "User",
          role: "USER",
          consentVersion: "1.0",
        });

      expect(preRes.body.user).toBeDefined();
      createdUserId = preRes.body.user.id_user;

      const res = await request(app)
        .post("/api/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email,
          password: "Password123",
          firstname: "Test",
          lastname: "User",
          role: "USER",
          consentVersion: "1.0",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Email déjà utilisé");
    });
  });

  // =========================
  // GET /api/user/:id
  // =========================
  describe("GET /api/user/:id", () => {
    it("devrait retourner l'utilisateur créé", async () => {
      const email = randomEmail();
      const createRes = await request(app)
        .post("/api/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email,
          password: "Password123",
          firstname: "Test",
          lastname: "User",
          role: "USER",
          consentVersion: "1.0",
        });

      expect(createRes.body.user).toBeDefined();
      createdUserId = createRes.body.user.id_user;

      const res = await request(app)
        .get(`/api/user/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id_user).toBe(createdUserId);
    });

    it("devrait retourner 404 si utilisateur non trouvé", async () => {
      const res = await request(app)
        .get("/api/user/999999")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Utilisateur non trouvé");
    });
  });

  // =========================
  // PUT /api/user/:id
  // =========================
  describe("PUT /api/user/:id", () => {
    it("devrait mettre à jour l'utilisateur", async () => {
      const email = randomEmail();
      const createRes = await request(app)
        .post("/api/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email,
          password: "Password123",
          firstname: "Test",
          lastname: "User",
          role: "USER",
          consentVersion: "1.0",
        });

      expect(createRes.body.user).toBeDefined();
      createdUserId = createRes.body.user.id_user;

      const res = await request(app)
        .put(`/api/user/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          firstname: "Updated",
          lastname: "User",
          phone: "0708091011",
          role: "ADMIN",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.user.firstname).toBe("Updated");
      expect(res.body.user.role).toBe("ADMIN");
    });

    it("devrait retourner 404 si utilisateur non trouvé", async () => {
      const res = await request(app)
        .put("/api/user/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ firstname: "X" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Utilisateur non trouvé");
    });
  });

  // =========================
  // DELETE /api/user/:id
  // =========================
  describe("DELETE /api/user/:id", () => {
    it("devrait anonymiser l'utilisateur", async () => {
      const email = randomEmail();
      const createRes = await request(app)
        .post("/api/user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email,
          password: "Password123",
          firstname: "Test",
          lastname: "User",
          role: "USER",
          consentVersion: "1.0",
        });

      expect(createRes.body.user).toBeDefined();
      createdUserId = createRes.body.user.id_user;

      const res = await request(app)
        .delete(`/api/user/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/Utilisateur anonymisé/);
    });

    it("devrait retourner 404 si utilisateur non trouvé", async () => {
      const res = await request(app)
        .delete("/api/user/999999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Utilisateur non trouvé");
    });
  });
});
