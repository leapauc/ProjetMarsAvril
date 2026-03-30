const request = require("supertest");
const app = require("../app"); // ton app Express
const pool = require("../db");

beforeAll(async () => {
  // Créer un événement de test
  await pool.query(
    `INSERT INTO events 
     (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [
      "Test Event",
      "Événement pour tests",
      new Date().toISOString(),
      "Paris",
      10,
      1, // id_orga (existe dans users)
      true,
    ],
  );
});

afterAll(async () => {
  // Supprimer l'événement de test
  await pool.query(
    `DELETE FROM events WHERE title='Test Event' OR title LIKE 'Updated Event %'`,
  );
  await pool.end();
});

describe("Events API", () => {
  let testEventId;

  test("GET /api/event -> doit retourner tous les événements publiés", async () => {
    const res = await request(app).get("/api/event");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const event = res.body.find((e) => e.title === "Test Event");
    testEventId = event.id_event;
    expect(event).toBeDefined();
  });

  test("GET /api/event/:id -> doit retourner un événement existant", async () => {
    const res = await request(app).get(`/api/event/${testEventId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Test Event");
    expect(res.body.location).toBe("Paris");
  });

  test("GET /api/event/:id -> retourne 404 pour un événement inexistant", async () => {
    const res = await request(app).get("/api/event/999999");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Événement non trouvé");
  });

  test("POST /api/event -> crée un nouvel événement", async () => {
    const newEvent = {
      title: `New Event ${Date.now()}`,
      description: "Description test",
      event_date: new Date().toISOString(),
      location: "Lyon",
      max_participants: 20,
      id_orga: 1,
      is_published: true,
    };

    const res = await request(app).post("/api/event").send(newEvent);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Événement créé");
    expect(res.body.event.title).toBe(newEvent.title);

    // Nettoyer
    await pool.query("DELETE FROM events WHERE id_event=$1", [
      res.body.event.id_event,
    ]);
  });

  test("PUT /api/event/:id -> met à jour un événement existant", async () => {
    const updatedEvent = {
      title: `Updated Event ${Date.now()}`,
      description: "Description mise à jour",
      event_date: new Date().toISOString(),
      location: "Marseille",
      max_participants: 50,
      is_published: false,
      id_orga: 1, // doit correspondre à l'organisateur
    };

    const res = await request(app)
      .put(`/api/event/${testEventId}`)
      .send(updatedEvent);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Événement mis à jour");
    expect(res.body.event.title).toBe(updatedEvent.title);
    expect(res.body.event.location).toBe("Marseille");
  });

  test("PUT /api/event/:id -> retourne 403 si id_orga différent", async () => {
    const res = await request(app)
      .put(`/api/event/${testEventId}`)
      .send({ title: "X", id_orga: 999 });
    expect(res.statusCode).toBe(403);
  });

  test("PUT /api/event/:id -> retourne 404 si événement inexistant", async () => {
    const res = await request(app)
      .put("/api/event/999999")
      .send({ title: "X", id_orga: 1 });
    expect(res.statusCode).toBe(404);
  });

  test("DELETE /api/event/:id -> supprime un événement existant", async () => {
    // Créer un événement temporaire pour suppression
    const { rows } = await pool.query(
      `INSERT INTO events (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING id_event`,
      ["Temp Event", "Temp", new Date().toISOString(), "Paris", 10, 1, true],
    );
    const tempEventId = rows[0].id_event;

    const res = await request(app)
      .delete(`/api/event/${tempEventId}`)
      .send({ id_orga: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Événement supprimé avec succès");
  });

  test("DELETE /api/event/:id -> retourne 403 si id_orga différent", async () => {
    const res = await request(app)
      .delete(`/api/event/${testEventId}`)
      .send({ id_orga: 999 });
    expect(res.statusCode).toBe(403);
  });

  test("DELETE /api/event/:id -> retourne 404 si événement inexistant", async () => {
    const res = await request(app)
      .delete("/api/event/999999")
      .send({ id_orga: 1 });
    expect(res.statusCode).toBe(404);
  });
});
