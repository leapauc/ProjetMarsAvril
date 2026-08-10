const request = require("supertest");
const app = require("../app"); // Ton express app
const pool = require("../db");

let testUser;
let authToken;

beforeAll(async () => {
  // Création d'un utilisateur test avec toutes les colonnes NOT NULL
  const now = new Date();
  const result = await pool.query(
    `INSERT INTO users 
       (email, firstname, lastname, phone, role, password, consent_date, consent_version, is_anonymized, created_at)
     VALUES ($1, $2, $3, $4, $5, crypt($6, gen_salt('bf')), $7, $8, $9, $10)
     RETURNING *`,
    [
      "test.user@example.com", // email
      "Test", // firstname
      "User", // lastname
      "0600000000", // phone
      "USER", // role
      "Password123!", // password
      now, // consent_date
      "v1", // consent_version
      false, // is_anonymized
      now, // created_at
    ],
  );
  testUser = result.rows[0];

  // Connexion pour récupérer le token
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "test.user@example.com", password: "Password123!" });

  authToken = loginRes.body.token;
});

afterAll(async () => {
  // Suppression sécurisée : logs liés
  await pool.query(
    `DELETE FROM user_action_log WHERE id_target_user=$1 OR id_actor_user=$1`,
    [testUser.id_user],
  );
  await pool.query(`DELETE FROM consent_log WHERE id_user=$1`, [
    testUser.id_user,
  ]);
  // Suppression de l'utilisateur
  await pool.query("DELETE FROM users WHERE id_user=$1", [testUser.id_user]);
  await pool.end();
});

describe("API /api/me/:id", () => {
  test("GET /api/me/:id - ADMIN récupère ses événements créés", async () => {
    const now = new Date();
    const adminInsert = await pool.query(
      `INSERT INTO users 
         (email, firstname, lastname, phone, role, password, consent_date, consent_version, is_anonymized, created_at)
       VALUES ($1, $2, $3, $4, $5, crypt($6, gen_salt('bf')), $7, $8, $9, $10)
       RETURNING *`,
      [
        `admin.dashboard.${Date.now()}@example.com`,
        "Admin",
        "Dashboard",
        "0600000000",
        "ADMIN",
        "Password123!",
        now,
        "v1",
        false,
        now,
      ],
    );

    const adminUser = adminInsert.rows[0];

    const eventInsert = await pool.query(
      `INSERT INTO events (title, description, event_date, location, max_participants, duration, id_orga, is_published, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        "Event Admin Dashboard",
        "À retrouver dans le dashboard admin",
        "2026-08-11 10:00:00",
        "Paris",
        20,
        60,
        adminUser.id_user,
        true,
      ],
    );

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminUser.email, password: "Password123!" });

    const res = await request(app)
      .get(`/api/me/${adminUser.id_user}`)
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe("ADMIN");
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.some((event) => event.id_event === eventInsert.rows[0].id_event)).toBe(true);

    await pool.query("DELETE FROM events WHERE id_event=$1", [eventInsert.rows[0].id_event]);
    await pool.query("DELETE FROM user_action_log WHERE id_target_user=$1 OR id_actor_user=$1", [adminUser.id_user]);
    await pool.query("DELETE FROM consent_log WHERE id_user=$1", [adminUser.id_user]);
    await pool.query("DELETE FROM users WHERE id_user=$1", [adminUser.id_user]);
  });

  test("GET /api/me/:id - récupère les données personnelles", async () => {
    const res = await request(app)
      .get(`/api/me/${testUser.id_user}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testUser.email);
  });

  test("PUT /api/me/:id - met à jour les données personnelles", async () => {
    const updatedData = {
      email: "updated.user@example.com",
      firstname: "Updated",
      lastname: "User",
      phone: "0612345678",
    };
    const res = await request(app)
      .put(`/api/me/${testUser.id_user}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(updatedData.email);
    expect(res.body.user.firstname).toBe(updatedData.firstname);

    // Réinitialiser l'utilisateur
    await pool.query(
      `UPDATE users SET email=$1, firstname=$2, lastname=$3, phone=$4 WHERE id_user=$5`,
      [
        testUser.email,
        testUser.firstname,
        testUser.lastname,
        testUser.phone,
        testUser.id_user,
      ],
    );
  });

  test("DELETE /api/me/:id - anonymise l'utilisateur", async () => {
    const res = await request(app)
      .delete(`/api/me/${testUser.id_user}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Compte anonymisé avec succès");

    // Réinitialiser les données pour autres tests
    await pool.query(
      `UPDATE users SET email=$1, firstname=$2, lastname=$3, phone=$4, is_anonymized=FALSE WHERE id_user=$5`,
      [
        testUser.email,
        testUser.firstname,
        testUser.lastname,
        testUser.phone,
        testUser.id_user,
      ],
    );
  });

  test("GET /api/me/:id/export - export JSON", async () => {
    const res = await request(app)
      .get(`/api/me/${testUser.id_user}/export`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.email).toBe(testUser.email);
  });

  test("GET /api/me/:id/export/pdf - export PDF", async () => {
    const res = await request(app)
      .get(`/api/me/${testUser.id_user}/export/pdf`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain(
      `eventflow_donnees_${testUser.id_user}.pdf`,
    );
  });
});
