require("dotenv").config();
const pool = require("../db");

// GET /me/:id -> récupérer les données personnelles
exports.getMyData = async (req, res) => {
  try {
    const { id } = req.params;

    const userQuery = await pool.query(
      `SELECT id_user, email, firstname, lastname, phone, role, consent_date, consent_version, is_anonymized, created_at
       FROM users
       WHERE id_user = $1`,
      [id],
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Log RGPD
    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_accessed',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Consultation des données personnelles"],
    );

    res.json(userQuery.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// PUT /me/:id -> modifier les données
exports.updateMyData = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstname, lastname, phone } = req.body;

    const userQuery = await pool.query("SELECT * FROM users WHERE id_user=$1", [
      id,
    ]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const updatedUser = await pool.query(
      `UPDATE users 
       SET email=$1, firstname=$2, lastname=$3, phone=$4
       WHERE id_user=$5
       RETURNING id_user, email, firstname, lastname, phone`,
      [email, firstname, lastname, phone || null, id],
    );

    // Log RGPD
    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_accessed',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Modification des données personnelles"],
    );

    res.json({ message: "Données mises à jour", user: updatedUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// DELETE /me/:id -> anonymisation (RGPD)
exports.deleteMyData = async (req, res) => {
  try {
    const { id } = req.params;

    const userQuery = await pool.query("SELECT * FROM users WHERE id_user=$1", [
      id,
    ]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Anonymisation (pas suppression)
    await pool.query(
      `UPDATE users
       SET 
         email = encode(digest(email, 'sha256'), 'hex'),
         firstname = 'Utilisateur supprimé',
         lastname = 'Utilisateur supprimé',
         phone = NULL,
         is_anonymized = TRUE
       WHERE id_user = $1`,
      [id],
    );

    // Log RGPD
    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_deleted',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Anonymisation du compte"],
    );

    res.json({ message: "Compte anonymisé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
