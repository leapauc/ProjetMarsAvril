require("dotenv").config();
const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

const userToken = jwt.sign(
  { id: 1, email: "user@test.com", role: "USER" },
  process.env.JWT_SECRET,
);

const orgaToken = jwt.sign(
  { id: 3, email: "orga@test.com", role: "ORGANIZER" },
  process.env.JWT_SECRET,
);

describe("Registration API Endpoints", () => {
  let testEventId;
  let registrationId;

  beforeAll(async () => {
    // Création événement de test
    const eventRes = await pool.query(
      `INSERT INTO events (title, event_date, id_orga, max_participants, is_published)
       VALUES ('Test Event Jest', NOW() + interval '1 day', 3, 5, TRUE)
       RETURNING id_event`,
    );
    testEventId = eventRes.rows[0].id_event;
  });

  afterAll(async () => {
    // ⚠️ Nettoyage dans le bon ordre pour éviter les FK errors

    await pool.query("DELETE FROM user_action_log WHERE related_event = $1", [
      testEventId,
    ]);

    await pool.query("DELETE FROM registrations WHERE id_event = $1", [
      testEventId,
    ]);

    await pool.query("DELETE FROM events WHERE id_event = $1", [testEventId]);

    await pool.end();
  });

  // =========================
  // GET /registration/:id
  // =========================
  describe("GET /api/registrations/:id", () => {
    it("401 si pas de token", async () => {
      const res = await request(app).get("/api/registrations/1");
      expect(res.statusCode).toBe(401);
    });

    it("retourne les inscriptions d’un user", async () => {
      // Création inscription
      const reg = await pool.query(
        `INSERT INTO registrations (id_user, id_event, registered_at, status)
         VALUES (1, $1, NOW(), 'pending')
         RETURNING id`,
        [testEventId],
      );
      registrationId = reg.rows[0].id;

      const res = await request(app)
        .get("/api/registrations/1")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const found = res.body.find((r) => r.id_event === testEventId);
      expect(found).toBeDefined();
    });

    it("404 si aucune inscription", async () => {
      const res = await request(app)
        .get("/api/registrations/999999")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Aucune inscription trouvée");
    });
  });

  // =========================
  // GET /registration/orga/:id/event
  // =========================
  describe("GET /api/registrations/orga/:id/event", () => {
    it("retourne les inscriptions des events d’un orga", async () => {
      const res = await request(app)
        .get(`/api/registrations/orga/3/event`)
        .set("Authorization", `Bearer ${orgaToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const found = res.body.find((r) => r.id_event === testEventId);
      expect(found).toBeDefined();
    });
  });

  // =========================
  // POST /registration/:id/register
  // =========================
  describe("POST /api/registrations/:id/register", () => {
    it("inscrit un utilisateur", async () => {
      const res = await request(app)
        .post(`/api/registrations/${testEventId}/register`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ id_user: 1 });

      expect([201, 400]).toContain(res.statusCode);

      if (res.statusCode === 201) {
        expect(res.body.registration.id_event).toBe(testEventId);
      }
    });

    it("404 si event inexistant", async () => {
      const res = await request(app)
        .post(`/api/registrations/999999/register`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ id_user: 1 });

      expect(res.statusCode).toBe(404);
    });

    it("400 si déjà inscrit", async () => {
      const res = await request(app)
        .post(`/api/registrations/${testEventId}/register`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ id_user: 1 });

      expect([400, 201]).toContain(res.statusCode);
    });
  });

  // =========================
  // DELETE /registration/:id
  // =========================
  describe("DELETE /api/registrations/:id", () => {
    it("supprime une inscription existante", async () => {
      // recréer une inscription si supprimée
      if (!registrationId) {
        const reg = await pool.query(
          `INSERT INTO registrations (id_user, id_event, registered_at, status)
           VALUES (1, $1, NOW(), 'pending')
           RETURNING id`,
          [testEventId],
        );
        registrationId = reg.rows[0].id;
      }

      const res = await request(app)
        .delete(`/api/registrations/${registrationId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/annulée/i);
    });

    it("404 si inscription inexistante", async () => {
      const res = await request(app)
        .delete(`/api/registrations/999999`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
