require("dotenv").config();
const pool = require("../db");
const logUserAction = require("../utils/logUserAction");

// GET /user -> récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT id_user, email, firstname, lastname, phone, role, is_anonymized, created_at 
       FROM users
       ORDER BY id_user ASC`,
    );
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /user/:id -> récupérer un utilisateur
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query(
      `SELECT id_user, email, firstname, lastname, phone, role, is_anonymized, created_at 
       FROM users
       WHERE id_user = $1`,
      [id],
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /user -> créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstname,
      lastname,
      phone,
      role,
      consentVersion,
    } = req.body;

    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const newUser = await pool.query(
      `INSERT INTO users 
       (email, password, firstname, lastname, phone, role, consent_date, consent_version, is_anonymized)
       VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5, $6, NOW(), $7, FALSE)
       RETURNING id_user, email, firstname, lastname, role`,
      [
        email,
        password,
        firstname,
        lastname,
        phone || null,
        role || "USER",
        consentVersion,
      ],
    );

    // Log de l'inscription
    await logUserAction(
      newUser.rows[0].id_user,
      newUser.rows[0].id_user,
      "user_registered",
      null,
      "Inscription par l’utilisateur",
    );

    res
      .status(201)
      .json({ message: "Utilisateur créé", user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// PUT /user/:id -> modifier un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstname, lastname, phone, role } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE id_user=$1", [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (email && email !== user.rows[0].email) {
      const existing = await pool.query("SELECT * FROM users WHERE email=$1", [
        email,
      ]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }
    }

    const updatedUser = await pool.query(
      `UPDATE users 
   SET email=$1, firstname=$2, lastname=$3, phone=$4, role=$5
   WHERE id_user=$6
   RETURNING id_user, email, firstname, lastname, phone, role`,
      [
        email || user.rows[0].email,
        firstname || user.rows[0].firstname,
        lastname || user.rows[0].lastname,
        phone || user.rows[0].phone,
        role || user.rows[0].role,
        id,
      ],
    );

    // Log modification
    await logUserAction(
      id,
      id,
      "user_data_modified",
      null,
      "Modification des informations personnelles",
    );

    res.json({ message: "Utilisateur mis à jour", user: updatedUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// DELETE /user/:id -> anonymisation RGPD
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pool.query("SELECT * FROM users WHERE id_user=$1", [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await pool.query(
      `UPDATE users
       SET 
         email = crypt(concat(email, random()::text, clock_timestamp()::text), gen_salt('bf')),
         firstname = 'Utilisateur supprimé',
         lastname = 'Utilisateur supprimé',
         phone = NULL,
         is_anonymized = TRUE
       WHERE id_user = $1`,
      [id],
    );

    // Log anonymisation
    await logUserAction(id, id, "data_deleted", null, "Anonymisation RGPD");

    res.json({ message: "Utilisateur anonymisé (RGPD)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
