require("dotenv").config();
const pool = require("../db"); // instance pg Pool
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email],
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await pool.query(
      `INSERT INTO users 
      (email, password, firstname, lastname, phone, role, consent_date, consent_version, is_anonymized)
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7,FALSE)
      RETURNING *`,
      [
        email,
        hashedPassword,
        firstname,
        lastname,
        phone || null,
        role || "USER",
        consentVersion,
      ],
    );

    const user = newUser.rows[0];

    // Enregistrer le consentement dans consent_log
    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'consent_given',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [
        user.id_user,
        req.ip || "0.0.0.0",
        `Inscription avec version ${consentVersion}`,
      ],
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: { id: user.id_user, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const userQuery = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (userQuery.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const user = userQuery.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // Générer un JWT
    const token = jwt.sign(
      { id_user: user.id_user, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ message: "Connexion réussie", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
