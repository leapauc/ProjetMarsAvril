require("dotenv").config();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Fonction utilitaire pour générer un token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id_user,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
};

// POST /api/auth/register
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

    // Validation
    if (!email || !password || !firstname || !lastname || !consentVersion) {
      return res.status(400).json({
        message: "Champs obligatoires manquants",
      });
    }

    // Vérifier email unique
    const existing = await pool.query(
      "SELECT id_user FROM users WHERE email = $1",
      [email],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Email déjà utilisé",
      });
    }

    // Insert user
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

    // Générer token après inscription
    const token = generateToken(user);

    res.status(201).json({
      message: "Utilisateur créé",
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe requis",
      });
    }

    // Vérification credentials
    const result = await pool.query(
      `
      SELECT id_user, email, firstname, lastname, role
      FROM users
      WHERE email = $1
        AND password = crypt($2, password)
      `,
      [email, password],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    const user = result.rows[0];

    // Génération token
    const token = generateToken(user);

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};
