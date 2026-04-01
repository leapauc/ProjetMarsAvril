// tests/registration.test.js
const request = require("supertest");
const app = require("../app"); // ton Express app
const pool = require("../db");

// Mock sendEmail pour ne pas envoyer de vrais mails
jest.mock("../utils/sendEmail", () => jest.fn(() => Promise.resolve()));

const sendEmail = require("../utils/sendEmail");

describe("Registration API Endpoints", () => {
  let userId;
  let eventId;
  let registrationId;

  beforeAll(async () => {
    // Crée un user pour test
    const userRes = await pool.query(
      "INSERT INTO users (firstname, lastname, email, password) VALUES ($1,$2,$3,$4) RETURNING id_user",
      ["Test", "User", "test@example.com", "hashedpassword"],
    );
    userId = userRes.rows[0].id_user;

    // Crée un event pour test
    const eventRes = await pool.query(
      "INSERT INTO events (title, event_date, id_orga, is_published, max_participants) VALUES ($1,$2,$3,$4,$5) RETURNING id_event",
      ["Test Event", new Date(), userId, true, 10],
    );
    eventId = eventRes.rows[0].id_event;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM registrations");
    await pool.query("DELETE FROM events");
    await pool.query("DELETE FROM users");
    await pool.end();
  });

  describe("POST /registration/:id/register", () => {
    it("devrait inscrire un utilisateur à un événement", async () => {
      const res = await request(app)
        .post(`/registration/${eventId}/register`)
        .send({ id_user: userId });

      expect(res.statusCode).toBe(201);
      expect(res.body.id_user).toBe(userId);
      expect(res.body.id_event).toBe(eventId);

      registrationId = res.body.id; // sauvegarder pour tests suivants
      expect(sendEmail).toHaveBeenCalled();
    });

    it("ne devrait pas inscrire deux fois le même utilisateur", async () => {
      const res = await request(app)
        .post(`/registration/${eventId}/register`)
        .send({ id_user: userId });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Déjà inscrit");
    });
  });

  describe("GET /registration/:id", () => {
    it("devrait récupérer les inscriptions de l'utilisateur", async () => {
      const res = await request(app).get(`/registration/${userId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id_event).toBe(eventId);
    });

    it("devrait renvoyer 404 si aucune inscription", async () => {
      const res = await request(app).get(`/registration/999999`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Aucune inscription trouvée");
    });
  });

  describe("PATCH /registration/:id/status", () => {
    it("devrait confirmer une inscription", async () => {
      const res = await request(app)
        .patch(`/registration/${registrationId}/status`)
        .send({ status: "confirmed" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("confirmed");
      expect(sendEmail).toHaveBeenCalled();
    });

    it("devrait refuser une inscription", async () => {
      // Crée une autre inscription pour test
      const regRes = await pool.query(
        "INSERT INTO registrations (id_user, id_event) VALUES ($1,$2) RETURNING id",
        [userId, eventId],
      );
      const newRegId = regRes.rows[0].id;

      const res = await request(app)
        .patch(`/registration/${newRegId}/status`)
        .send({ status: "cancelled" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("cancelled");
      expect(sendEmail).toHaveBeenCalled();
    });

    it("devrait renvoyer 400 pour statut invalide", async () => {
      const res = await request(app)
        .patch(`/registration/${registrationId}/status`)
        .send({ status: "invalid" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Statut invalide");
    });
  });

  describe("DELETE /registration/:id", () => {
    it("devrait annuler une inscription existante", async () => {
      const res = await request(app).delete(`/registration/${registrationId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Inscription annulée avec succès");
      expect(sendEmail).toHaveBeenCalled();
    });

    it("devrait renvoyer 404 si inscription inexistante", async () => {
      const res = await request(app).delete(`/registration/999999`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Inscription non trouvée");
    });
  });
});
