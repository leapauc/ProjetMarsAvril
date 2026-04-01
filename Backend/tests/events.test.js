require("dotenv").config();
const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const jwt = require("jsonwebtoken");

const randomTitle = () => `Event ${Math.floor(Math.random() * 100000)}`;

describe("Events API Endpoints", () => {
  let testEventId;
  let orgaUserId;
  let orgaToken;
  let adminToken;
  let orgaEmail;

  beforeAll(async () => {
    // Générer un email unique pour éviter les conflits
    orgaEmail = `orga_test_${Date.now()}@mail.com`;

    // Création d'un utilisateur ORGANIZER
    const res = await pool.query(
      `INSERT INTO users 
       (email, password, firstname, lastname, role, consent_version, consent_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(), NOW()) RETURNING id_user`,
      [orgaEmail, "hashedpass", "Org", "Anizer", "ORGANIZER", "1.0"],
    );
    orgaUserId = res.rows[0].id_user;

    // Token JWT pour l'organisateur
    orgaToken = jwt.sign(
      { id: orgaUserId, email: orgaEmail, role: "ORGANIZER" },
      process.env.JWT_SECRET,
    );

    // Token admin
    adminToken = jwt.sign(
      { id: 999, email: "admin@test.com", role: "ADMIN" },
      process.env.JWT_SECRET,
    );
  });

  beforeEach(async () => {
    // Création d'un événement unique avant chaque test
    const res = await pool.query(
      `INSERT INTO events 
        (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
       VALUES ($1, $2, NOW() + interval '1 day', $3, $4, $5, TRUE, NOW())
       RETURNING id_event`,
      [randomTitle(), "Test desc", "Paris", 10, orgaUserId],
    );
    testEventId = res.rows[0].id_event;
  });

  afterEach(async () => {
    if (testEventId) {
      await pool.query("DELETE FROM user_action_log WHERE related_event = $1", [
        testEventId,
      ]);
      await pool.query("DELETE FROM registrations WHERE id_event = $1", [
        testEventId,
      ]);
      await pool.query("DELETE FROM events WHERE id_event = $1", [testEventId]);
      testEventId = null;
    }
  });

  afterAll(async () => {
    // Supprime l'organisateur factice
    if (orgaUserId) {
      await pool.query("DELETE FROM users WHERE id_user = $1", [orgaUserId]);
    }
    await pool.end();
  });

  // =========================
  // GET /event
  // =========================
  it("GET /api/event - retourne les événements publiés", async () => {
    const res = await request(app).get("/api/event");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((e) => e.id_event === testEventId);
    expect(found).toBeDefined();
  });

  it("GET /api/event/:id - retourne un événement existant", async () => {
    const res = await request(app).get(`/api/event/${testEventId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id_event).toBe(testEventId);
  });

  it("GET /api/event/:id - 404 si événement inexistant", async () => {
    const res = await request(app).get("/api/event/999999");
    expect(res.statusCode).toBe(404);
  });

  // =========================
  // POST /event
  // =========================
  it("POST /api/event - 401 sans token", async () => {
    const res = await request(app).post("/api/event").send({});
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/event - 403 si pas organizer", async () => {
    const userToken = jwt.sign(
      { id: 1, email: "user@test.com", role: "USER" },
      process.env.JWT_SECRET,
    );
    const res = await request(app)
      .post("/api/event")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.statusCode).toBe(403);
  });

  it("POST /api/event - crée un événement", async () => {
    const res = await request(app)
      .post("/api/event")
      .set("Authorization", `Bearer ${orgaToken}`)
      .send({
        title: randomTitle(),
        description: "desc",
        event_date: new Date().toISOString(),
        location: "Paris",
        max_participants: 20,
        id_orga: orgaUserId,
        is_published: true,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.event).toBeDefined();

    // Cleanup immédiat
    const id = res.body.event.id_event;
    await pool.query("DELETE FROM user_action_log WHERE related_event = $1", [
      id,
    ]);
    await pool.query("DELETE FROM events WHERE id_event = $1", [id]);
  });

  // =========================
  // PUT /event/:id
  // =========================
  it("PUT /api/event/:id - met à jour un événement", async () => {
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
        id_orga: orgaUserId,
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.event.title).toBe("Updated Event");
  });

  it("PUT /api/event/:id - 403 si mauvais organisateur", async () => {
    const res = await request(app)
      .put(`/api/event/${testEventId}`)
      .set("Authorization", `Bearer ${orgaToken}`)
      .send({ id_orga: 999 });
    expect(res.statusCode).toBe(403);
  });

  it("PUT /api/event/:id - 404 si event inexistant", async () => {
    const res = await request(app)
      .put("/api/event/999999")
      .set("Authorization", `Bearer ${orgaToken}`)
      .send({});
    expect(res.statusCode).toBe(404);
  });

  // =========================
  // DELETE /event/:id
  // =========================
  it("DELETE /api/event/:id - supprime un event (ADMIN)", async () => {
    const temp = await pool.query(
      `INSERT INTO events (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
       VALUES ($1,$2,NOW(),$3,$4,$5,TRUE,NOW()) RETURNING id_event`,
      [randomTitle(), "Temp", "Paris", 5, orgaUserId],
    );
    const tempId = temp.rows[0].id_event;

    const res = await request(app)
      .delete(`/api/event/${tempId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);

    await pool.query("DELETE FROM user_action_log WHERE related_event = $1", [
      tempId,
    ]);
  });

  it("DELETE /api/event/:id - 404 si event inexistant", async () => {
    const res = await request(app)
      .delete("/api/event/999999")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});
