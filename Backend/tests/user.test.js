// tests/user.test.js
const request = require("supertest");
const app = require("../app");
const pool = require("../db");

beforeAll(async () => {
  // Supprimer les utilisateurs test existants pour éviter les doublons
  await pool.query(`DELETE FROM users WHERE email IN ($1, $2)`, [
    "test.user@example.com",
    "new.user@example.com",
  ]);

  // Créer un utilisateur de test
  await pool.query(
    `INSERT INTO users 
     (email, password, firstname, lastname, role, consent_date, consent_version, is_anonymized)
     VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5, NOW(), 'v1', FALSE)`,
    ["test.user@example.com", "test1234", "Test", "User", "USER"],
  );
});

afterAll(async () => {
  // Supprimer les utilisateurs test
  await pool.query(`DELETE FROM users WHERE email IN ($1, $2)`, [
    "test.user@example.com",
    "new.user@example.com",
  ]);
  await pool.end();
});

describe("Users API", () => {
  let testUserId;

  test("GET /api/user -> doit retourner tous les utilisateurs", async () => {
    const res = await request(app).get("/api/user");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const testUser = res.body.find((u) => u.email === "test.user@example.com");
    expect(testUser).toBeDefined();
    testUserId = testUser.id_user;
  });

  test("GET /api/user/:id -> doit retourner un utilisateur existant", async () => {
    const res = await request(app).get(`/api/user/${testUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe("test.user@example.com");
    expect(res.body.firstname).toBe("Test");
    expect(res.body.lastname).toBe("User");
  });

  test("GET /api/user/:id -> retourne 404 pour un utilisateur inexistant", async () => {
    const res = await request(app).get("/api/user/999999");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Utilisateur non trouvé");
  });

  test("POST /api/user -> crée un nouvel utilisateur", async () => {
    const newUser = {
      email: "new.user@example.com",
      password: "password123",
      firstname: "New",
      lastname: "User",
      role: "USER",
      consentVersion: "v1",
    };

    const res = await request(app).post("/api/user").send(newUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Utilisateur créé");
    expect(res.body.user.email).toBe("new.user@example.com");

    // Nettoyer immédiatement
    await pool.query("DELETE FROM users WHERE email=$1", [
      "new.user@example.com",
    ]);
  });

  test("POST /api/user -> retourne 400 si email déjà utilisé", async () => {
    const res = await request(app).post("/api/user").send({
      email: "test.user@example.com",
      password: "password",
      firstname: "Dup",
      lastname: "Dup",
      consentVersion: "v1",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email déjà utilisé");
  });

  test("PUT /api/user/:id -> met à jour un utilisateur existant", async () => {
    const uniqueEmail = `updated${Date.now()}@example.com`; // email unique à chaque run
    const res = await request(app).put(`/api/user/${testUserId}`).send({
      firstname: "Updated",
      lastname: "User",
      email: uniqueEmail,
      phone: "0601020304",
      role: "ADMIN",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Utilisateur mis à jour");
    expect(res.body.user.firstname).toBe("Updated");
    expect(res.body.user.email).toBe(uniqueEmail);
  });

  test("PUT /api/user/:id -> retourne 404 si utilisateur inexistant", async () => {
    const res = await request(app)
      .put("/api/user/999999")
      .send({ firstname: "X" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Utilisateur non trouvé");
  });

  test("DELETE /api/user/:id -> anonymise un utilisateur existant", async () => {
    const res = await request(app).delete(`/api/user/${testUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Utilisateur anonymisé (RGPD)");

    // Vérifier l'anonymisation dans la base
    const { rows } = await pool.query("SELECT * FROM users WHERE id_user=$1", [
      testUserId,
    ]);
    expect(rows[0].is_anonymized).toBe(true);
    expect(rows[0].firstname).toBe("Utilisateur supprimé");
    expect(rows[0].email).not.toBe("updated.user@example.com");
  });

  test("DELETE /api/user/:id -> retourne 404 si utilisateur inexistant", async () => {
    const res = await request(app).delete("/api/user/999999");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Utilisateur non trouvé");
  });
});
