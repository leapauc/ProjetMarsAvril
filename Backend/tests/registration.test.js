require("dotenv").config();
const request = require("supertest");
const app = require("../app");
const pool = require("../db");

// Mock sendEmail pour éviter l’envoi réel
jest.mock("../utils/sendEmail", () => jest.fn(() => Promise.resolve()));
const sendEmail = require("../utils/sendEmail");

// Fonction utilitaire pour emails et titres uniques
const randomEmail = () => `testuser${Date.now()}@mail.com`;
const randomTitle = () => `Event ${Date.now()}`;

describe("Registration API Endpoints", () => {
  let userId;
  let orgaId;
  let eventId;
  let registrationId;

  // Création des utilisateurs et événement avant chaque test
  beforeEach(async () => {
    const now = new Date();

    // Utilisateur test
    const userRes = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, consent_date, consent_version, is_anonymized, created_at) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id_user`,
      [
        "Test",
        "User",
        randomEmail(),
        "hashedpass",
        "USER",
        now,
        "v1",
        false,
        now,
      ],
    );
    userId = userRes.rows[0].id_user;

    // Organisateur test
    const orgaRes = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, consent_date, consent_version, is_anonymized, created_at) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id_user`,
      [
        "Org",
        "Anizer",
        randomEmail(),
        "hashedpass",
        "ORGANIZER",
        now,
        "v1",
        false,
        now,
      ],
    );
    orgaId = orgaRes.rows[0].id_user;

    // Événement publié
    const eventRes = await pool.query(
      `INSERT INTO events (title, event_date, id_orga, is_published, max_participants) 
       VALUES ($1,$2,$3,$4,$5) RETURNING id_event`,
      [randomTitle(), now, orgaId, true, 10],
    );
    eventId = eventRes.rows[0].id_event;

    registrationId = null;
    global.orgaId = orgaId; // Pour PATCH
  });

  afterEach(async () => {
    if (registrationId) {
      await pool.query("DELETE FROM registrations WHERE id=$1", [
        registrationId,
      ]);
      registrationId = null;
    }
    if (eventId)
      await pool.query("DELETE FROM events WHERE id_event=$1", [eventId]);
    if (userId)
      await pool.query("DELETE FROM users WHERE id_user=$1", [userId]);
    if (orgaId)
      await pool.query("DELETE FROM users WHERE id_user=$1", [orgaId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  // =========================
  // POST /registrations/:id/register
  // =========================
  describe("POST /api/registrations/:id/register", () => {
    it("inscrit un utilisateur à un événement", async () => {
      const res = await request(app)
        .post(`/api/registrations/${eventId}/register`)
        .send({ id_user: userId });

      expect(res.statusCode).toBe(201);
      expect(res.body.id_user).toBe(userId);
      expect(res.body.id_event).toBe(eventId);
      registrationId = res.body.id;

      expect(sendEmail).toHaveBeenCalled();
    });

    it("ne permet pas une double inscription", async () => {
      const first = await request(app)
        .post(`/api/registrations/${eventId}/register`)
        .send({ id_user: userId });
      registrationId = first.body.id;

      const res = await request(app)
        .post(`/api/registrations/${eventId}/register`)
        .send({ id_user: userId });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Déjà inscrit");
    });
  });

  // =========================
  // GET /registrations/:id
  // =========================
  describe("GET /api/registrations/:id", () => {
    it("récupère les inscriptions de l'utilisateur", async () => {
      const reg = await request(app)
        .post(`/api/registrations/${eventId}/register`)
        .send({ id_user: userId });
      registrationId = reg.body.id;

      const res = await request(app).get(`/api/registrations/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id_event).toBe(eventId);
    });

    it("retourne un tableau vide si aucune inscription", async () => {
      const res = await request(app).get("/api/registrations/999999");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  // =========================
  // PATCH /registrations/:id/status
  // =========================
  describe("PATCH /api/registrations/:id/status", () => {
    it("confirme une inscription", async () => {
      const reg = await request(app)
        .post(`/api/registrations/${eventId}/register`)
        .send({ id_user: userId });
      registrationId = reg.body.id;

      const res = await request(app)
        .patch(`/api/registrations/${registrationId}/status`)
        .send({ status: "confirmed" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("confirmed");
      expect(sendEmail).toHaveBeenCalled();
    });

    it("refuse une inscription", async () => {
      const reg = await request(app)
        .post(`/api/registrations/${eventId}/register`)
        .send({ id_user: userId });
      const newRegId = reg.body.id;

      const res = await request(app)
        .patch(`/api/registrations/${newRegId}/status`)
        .send({ status: "cancelled" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("cancelled");
      expect(sendEmail).toHaveBeenCalled();
    });

    it("renvoie 400 pour un statut invalide", async () => {
      const reg = await request(app)
        .post(`/api/registrations/${eventId}/register`)
        .send({ id_user: userId });
      registrationId = reg.body.id;

      const res = await request(app)
        .patch(`/api/registrations/${registrationId}/status`)
        .send({ status: "invalid" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Statut invalide");
    });
  });

  // =========================
  // DELETE /registrations/:id
  // =========================
  describe("DELETE /api/registrations/:id", () => {
    it("annule une inscription existante", async () => {
      const reg = await request(app)
        .post(`/api/registrations/${eventId}/register`)
        .send({ id_user: userId });
      registrationId = reg.body.id;

      const res = await request(app).delete(
        `/api/registrations/${registrationId}`,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Annulé");
      expect(sendEmail).toHaveBeenCalled();
    });

    it("retourne 404 si inscription inexistante", async () => {
      const res = await request(app).delete("/api/registrations/999999");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Inscription non trouvée");
    });
  });
});
