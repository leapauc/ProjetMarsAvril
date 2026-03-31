require("dotenv").config();
const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Tokens
const userToken = jwt.sign(
  { id: 1, email: "user@test.com", role: "USER" },
  process.env.JWT_SECRET,
);

const orgaToken = jwt.sign(
  { id: 3, email: "orga@test.com", role: "ORGANIZER" },
  process.env.JWT_SECRET,
);

const adminToken = jwt.sign(
  { id: 99, email: "admin@test.com", role: "ADMIN" },
  process.env.JWT_SECRET,
);

describe("Events API Endpoints", () => {
  let testEventId;

  beforeAll(async () => {
    const res = await pool.query(
      `INSERT INTO events 
      (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
      VALUES ('Event Jest', 'Test desc', NOW() + interval '1 day', 'Paris', 10, 3, TRUE, NOW())
      RETURNING id_event`,
    );

    testEventId = res.rows[0].id_event;
  });

  afterAll(async () => {
    // 🔥 nettoyage propre (ordre important)
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
  // GET /event
  // =========================
  describe("GET /api/event", () => {
    it("retourne les événements publiés", async () => {
      const res = await request(app).get("/api/event");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const found = res.body.find((e) => e.id_event === testEventId);
      expect(found).toBeDefined();
    });
  });

  // =========================
  // GET /event/:id
  // =========================
  describe("GET /api/event/:id", () => {
    it("retourne un événement existant", async () => {
      const res = await request(app).get(`/api/event/${testEventId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id_event).toBe(testEventId);
    });

    it("404 si événement inexistant", async () => {
      const res = await request(app).get("/api/event/999999");

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Événement non trouvé");
    });
  });

  // =========================
  // POST /event
  // =========================
  describe("POST /api/event", () => {
    it("401 sans token", async () => {
      const res = await request(app).post("/api/event").send({});
      expect(res.statusCode).toBe(401);
    });

    it("403 si pas organizer", async () => {
      const res = await request(app)
        .post("/api/event")
        .set("Authorization", `Bearer ${userToken}`)
        .send({});
      expect(res.statusCode).toBe(403);
    });

    it("crée un événement", async () => {
      const res = await request(app)
        .post("/api/event")
        .set("Authorization", `Bearer ${orgaToken}`)
        .send({
          title: "New Event",
          description: "desc",
          event_date: new Date().toISOString(),
          location: "Paris",
          max_participants: 20,
          id_orga: 3,
          is_published: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.event).toBeDefined();

      // cleanup immédiat
      const id = res.body.event.id_event;

      await pool.query("DELETE FROM user_action_log WHERE related_event = $1", [
        id,
      ]);
      await pool.query("DELETE FROM events WHERE id_event = $1", [id]);
    });
  });

  // =========================
  // PUT /event/:id
  // =========================
  describe("PUT /api/event/:id", () => {
    it("met à jour un event", async () => {
      const res = await request(app)
        .put(`/api/event/${testEventId}`)
        .set("Authorization", `Bearer ${orgaToken}`)
        .send({
          title: "Updated Event",
          description: "Updated",
          event_date: new Date().toISOString(),
          location: "Lyon",
          max_participants: 15,
          is_published: true,
          id_orga: 3,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.event.title).toBe("Updated Event");
    });

    it("403 si mauvais organisateur", async () => {
      const res = await request(app)
        .put(`/api/event/${testEventId}`)
        .set("Authorization", `Bearer ${orgaToken}`)
        .send({
          id_orga: 999,
        });

      expect(res.statusCode).toBe(403);
    });

    it("404 si event inexistant", async () => {
      const res = await request(app)
        .put("/api/event/999999")
        .set("Authorization", `Bearer ${orgaToken}`)
        .send({});

      expect(res.statusCode).toBe(404);
    });
  });

  // =========================
  // DELETE /event/:id
  // =========================
  describe("DELETE /api/event/:id", () => {
    it("supprime un event (ADMIN)", async () => {
      // créer event temporaire
      const temp = await pool.query(
        `INSERT INTO events (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
         VALUES ('Temp', 'Temp', NOW(), 'Paris', 5, 3, TRUE, NOW())
         RETURNING id_event`,
      );

      const tempId = temp.rows[0].id_event;

      const res = await request(app)
        .delete(`/api/event/${tempId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ id_orga: 3 });

      expect(res.statusCode).toBe(200);

      // cleanup logs
      await pool.query("DELETE FROM user_action_log WHERE related_event = $1", [
        tempId,
      ]);
    });

    it("404 si event inexistant", async () => {
      const res = await request(app)
        .delete("/api/event/999999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
