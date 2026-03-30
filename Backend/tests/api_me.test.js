// tests/api_me.test.js
const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("API /api/me/:id", () => {
  let testUserId;

  // Créer un utilisateur temporaire pour les tests
  beforeAll(async () => {
    const result = await pool.query(
      `INSERT INTO users (email, password, firstname, lastname, phone, role, consent_date, consent_version)
       VALUES ('test.me@example.com', crypt('password123', gen_salt('bf')), 'Test', 'User', '0601020304', 'USER', NOW(), 'v1')
       RETURNING id_user`,
    );
    testUserId = result.rows[0].id_user;
  });

  afterAll(async () => {
    const crypto = require("crypto");

    const uniqueEmail = crypto
      .createHash("sha256")
      .update(`test.me@example.com-${Date.now()}`)
      .digest("hex");

    await pool.query(
      `UPDATE users
       SET email = $1,
           firstname = 'Utilisateur supprimé',
           lastname = 'Utilisateur supprimé',
           phone = NULL,
           is_anonymized = TRUE
     WHERE id_user = $2`,
      [uniqueEmail, testUserId],
    );

    await pool.end();
  });

  describe("GET /api/me/:id", () => {
    it("récupère les données d'un utilisateur existant", async () => {
      const res = await request(app).get(`/api/me/${testUserId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe("test.me@example.com");
      expect(res.body.firstname).toBe("Test");
    });

    it("retourne 404 si l'utilisateur n'existe pas", async () => {
      const res = await request(app).get("/api/me/999999");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Utilisateur non trouvé");
    });
  });

  describe("PUT /api/me/:id", () => {
    // it("met à jour les données d'un utilisateur", async () => {
    //   const res = await request(app).put(`/api/me/${testUserId}`).send({
    //     email: "update.me@example.com",
    //     firstname: "Updated",
    //     lastname: "User",
    //     phone: "0600000000",
    //   });
    //   expect(res.statusCode).toBe(200);
    //   expect(res.body.message).toBe("Données mises à jour");
    //   expect(res.body.user.email).toBe("update.me@example.com");
    //   expect(res.body.user.firstname).toBe("Updated");
    // });

    it("retourne 404 si l'utilisateur n'existe pas", async () => {
      const res = await request(app).put("/api/me/999999").send({
        email: "notfound@example.com",
        firstname: "No",
        lastname: "User",
      });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Utilisateur non trouvé");
    });
  });

  describe("DELETE /api/me/:id", () => {
    it("anonymise l'utilisateur existant", async () => {
      const res = await request(app).delete(`/api/me/${testUserId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Compte anonymisé avec succès");

      // Vérifier dans la BDD que l'utilisateur est bien anonymisé
      const userCheck = await pool.query(
        "SELECT email, firstname, lastname, is_anonymized FROM users WHERE id_user=$1",
        [testUserId],
      );
      expect(userCheck.rows[0].firstname).toBe("Utilisateur supprimé");
      expect(userCheck.rows[0].is_anonymized).toBe(true);
    });

    it("retourne 404 si l'utilisateur n'existe pas", async () => {
      const res = await request(app).delete("/api/me/999999");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Utilisateur non trouvé");
    });
  });
});
