const request = require("supertest");
const app = require("../app");
const pool = require("../db");

let testEventId;
let testUserId = 1;
let testRegistrationId;

beforeAll(async () => {
  // Créer un événement de test pour les inscriptions
  const { rows } = await pool.query(
    `INSERT INTO events 
      (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING id_event`,
    [
      "Test Event for Registration",
      "Test registration",
      new Date().toISOString(),
      "Paris",
      10,
      testUserId,
      true,
    ],
  );
  testEventId = rows[0].id_event;
});

afterAll(async () => {
  // Nettoyer inscriptions et événements de test
  await pool.query("DELETE FROM registrations WHERE id_event=$1", [
    testEventId,
  ]);
  await pool.query("DELETE FROM events WHERE id_event=$1", [testEventId]);
  await pool.end();
});

describe("Registrations API", () => {
  test("GET /api/registrations/:id -> retourne 404 si aucune inscription", async () => {
    const res = await request(app).get(`/api/registrations/99999`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Aucune inscription trouvée");
  });

  test("POST /api/registrations/:id/register -> inscrire un utilisateur", async () => {
    const res = await request(app)
      .post(`/api/registrations/${testEventId}/register`)
      .send({ id_user: testUserId });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Inscription réussie");
    expect(res.body.registration.id_user).toBe(testUserId);
    expect(res.body.registration.id_event).toBe(testEventId);

    testRegistrationId = res.body.registration.id;
  });

  test("POST /api/registrations/:id/register -> retourne 400 si déjà inscrit", async () => {
    const res = await request(app)
      .post(`/api/registrations/${testEventId}/register`)
      .send({ id_user: testUserId });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Vous êtes déjà inscrit à cet événement");
  });

  test("GET /api/registrations/:id -> retourne les inscriptions de l'utilisateur", async () => {
    const res = await request(app).get(`/api/registrations/${testUserId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const reg = res.body.find((r) => r.id === testRegistrationId);
    expect(reg).toBeDefined();
    expect(reg.id_event).toBe(testEventId);
  });

  test("DELETE /api/registrations/:id -> annuler l'inscription", async () => {
    const res = await request(app)
      .delete(`/api/registrations/${testRegistrationId}`)
      .send({ id_user: testUserId });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Inscription annulée avec succès");
  });

  test("DELETE /api/registrations/:id -> retourne 404 si inscription inexistante", async () => {
    const res = await request(app)
      .delete(`/api/registrations/${testRegistrationId}`)
      .send({ id_user: testUserId });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe(
      "Inscription non trouvée pour cet utilisateur",
    );
  });

  test("POST /api/registrations/:id/register -> retourne 404 si événement non publié", async () => {
    // Créer un événement non publié
    const { rows } = await pool.query(
      `INSERT INTO events (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING id_event`,
      [
        "Unpublished Event",
        "Test",
        new Date().toISOString(),
        "Paris",
        10,
        testUserId,
        false,
      ],
    );
    const unpublishedEventId = rows[0].id_event;

    const res = await request(app)
      .post(`/api/registrations/${unpublishedEventId}/register`)
      .send({ id_user: testUserId });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Événement non trouvé ou non publié");

    // Cleanup
    await pool.query("DELETE FROM events WHERE id_event=$1", [
      unpublishedEventId,
    ]);
  });
});
