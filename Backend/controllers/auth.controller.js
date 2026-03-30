require("dotenv").config();
const pool = require("../db"); // instance pg Pool
const jwt = require("jsonwebtoken");

// POST /api/auth/register -> enregistrement d'un utilisateur
exports.registerUser = async (req, res) => {
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

    // Vérification champs obligatoires
    if (!email || !password || !firstname || !lastname || !consentVersion) {
      return res.status(400).json({
        message: "Champs obligatoires manquants",
      });
    }

    // Vérifier email unique
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Email déjà utilisé",
      });
    }

    // Insertion avec hash directement en SQL (pgcrypto)
    const result = await pool.query(
      `
      INSERT INTO users
      (email, password, firstname, lastname, phone, role, consent_date, consent_version, is_anonymized)
      VALUES (
        $1,
        crypt($2, gen_salt('bf')),
        $3,
        $4,
        $5,
        $6,
        NOW(),
        $7,
        FALSE
      )
      RETURNING id_user, email, firstname, lastname, role
      `,
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

    const user = result.rows[0];

    // Log RGPD
    await pool.query(
      `
      INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
      VALUES ($1, 'consent_given', NOW(), crypt($2, gen_salt('bf')), $3)
      `,
      [
        user.id_user,
        req.ip || "0.0.0.0",
        `Inscription - version ${consentVersion}`,
      ],
    );

    res.status(201).json({
      message: "Utilisateur créé",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// POST /api/auth/login -> authentification d'un utilisateur
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification des champs
    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe requis",
      });
    }

    // Vérifier email + mot de passe directement
    const result = await pool.query(
      `
      SELECT * 
      FROM praticiens
      WHERE email = $1 
        AND password_hash = crypt($2, password_hash)
      `,
      [email, password],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    const praticien = result.rows[0];

    // Mise à jour de la dernière connexion
    await pool.query(
      `
      UPDATE praticiens
      SET last_conn = NOW()
      WHERE id_praticien = $1
      `,
      [praticien.id_praticien],
    );

    // Réponse succès (sans JWT si tu veux simple)
    res.status(200).json({
      message: "Connexion réussie",
      praticien,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};
