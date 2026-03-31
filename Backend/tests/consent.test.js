const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

let token;
let testUserId;

beforeAll(async () => {
  // créer un utilisateur test
  const userRes = await pool.query(
    `INSERT INTO users (email, password, firstname, lastname, role, consent_version, consent_date)
     VALUES ('consent@test.com', 'password', 'Consent', 'User', 'USER', '1.0', NOW())
     RETURNING id_user`,
  );

  testUserId = userRes.rows[0].id_user;

  // créer un token JWT
  token = jwt.sign(
    { id: testUserId, email: "consent@test.com", role: "USER" },
    process.env.JWT_SECRET,
  );
});

afterAll(async () => {
  await pool.query("DELETE FROM consent_log WHERE id_user = $1", [testUserId]);
  await pool.query("DELETE FROM users WHERE id_user = $1", [testUserId]);
  await pool.end();
});

describe("Consent API Endpoints", () => {
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

      // vérifier en DB
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

    it("devrait refuser avec mauvais rôle", async () => {
      const badToken = jwt.sign(
        { id: testUserId, role: "ADMIN" }, // pas autorisé
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
