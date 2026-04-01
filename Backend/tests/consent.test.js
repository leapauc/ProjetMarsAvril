require("dotenv").config();
const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Utilitaires pour générer des emails uniques
const randomEmail = () =>
  `consent${Math.floor(Math.random() * 100000)}@test.com`;

describe("Consent API Endpoints", () => {
  let token;
  let testUserId;
  let testEmail;

  beforeEach(async () => {
    testEmail = randomEmail();

    // Création d'un utilisateur unique pour le test
    const userRes = await pool.query(
      `INSERT INTO users (email, password, firstname, lastname, role, consent_version, consent_date)
       VALUES ($1, 'password', 'Consent', 'User', 'USER', '1.0', NOW())
       RETURNING id_user`,
      [testEmail],
    );

    testUserId = userRes.rows[0].id_user;

    // Génération du token JWT pour cet utilisateur
    token = jwt.sign(
      { id: testUserId, email: testEmail, role: "USER" },
      process.env.JWT_SECRET,
    );
  });

  afterEach(async () => {
    // Nettoyage des logs et utilisateur
    await pool.query("DELETE FROM consent_log WHERE id_user = $1", [
      testUserId,
    ]);
    await pool.query("DELETE FROM users WHERE id_user = $1", [testUserId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("POST /api/consent", () => {
    it("devrait mettre à jour le consentement", async () => {
      const res = await request(app)
        .post("/api/consent")
        .set("Authorization", `Bearer ${token}`)
        .send({
          id_user: testUserId,
          consentVersion: "2.0",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Consentement mis à jour avec succès");

      // Vérification en base
      const user = await pool.query(
        "SELECT consent_version FROM users WHERE id_user = $1",
        [testUserId],
      );
      expect(user.rows[0].consent_version).toBe("2.0");
    });

    it("devrait retourner 404 si utilisateur inexistant", async () => {
      const res = await request(app)
        .post("/api/consent")
        .set("Authorization", `Bearer ${token}`)
        .send({
          id_user: 999999,
          consentVersion: "2.0",
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Utilisateur non trouvé");
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).post("/api/consent").send({
        id_user: testUserId,
        consentVersion: "2.0",
      });

      expect(res.statusCode).toBe(401);
    });

    it("devrait refuser avec rôle non autorisé", async () => {
      const badToken = jwt.sign(
        { id: testUserId, email: testEmail, role: "ADMIN" }, // rôle non autorisé
        process.env.JWT_SECRET,
      );

      const res = await request(app)
        .post("/api/consent")
        .set("Authorization", `Bearer ${badToken}`)
        .send({
          id_user: testUserId,
          consentVersion: "3.0",
        });

      expect(res.statusCode).toBe(403);
    });
  });
});
