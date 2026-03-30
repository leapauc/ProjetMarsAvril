require("dotenv").config();
const pool = require("../db");

// POST /api/consent -> mise à jour du consentement utilisateur
exports.postConsent = async (req, res) => {
  try {
    const { id_user, consentVersion } = req.body;
    const ipAddress = req.ip || "0.0.0.0";

    // Vérifier que l'utilisateur existe
    const userQuery = await pool.query("SELECT * FROM users WHERE id_user=$1", [
      id_user,
    ]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Mettre à jour la date et version du consentement
    await pool.query(
      `UPDATE users 
       SET consent_date = NOW(), consent_version = $1 
       WHERE id_user = $2`,
      [consentVersion, id_user],
    );

    // Ajouter un log dans consent_log
    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'consent_given',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id_user, ipAddress, `Consentement mis à jour vers ${consentVersion}`],
    );

    res.json({ message: "Consentement mis à jour avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
