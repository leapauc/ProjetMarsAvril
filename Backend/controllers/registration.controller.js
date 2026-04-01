require("dotenv").config();
const pool = require("../db"); // instance pg Pool
const logUserAction = require("../utils/logUserAction");
const sendEmail = require("../utils/sendEmail");
const {
  registerTemplate,
  statusTemplate,
  cancelTemplate,
} = require("../utils/emailTemplates");

// GET /:id/registrations -> récupérer les inscriptions d’un utilisateur ou d’un événement
exports.getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    // récupérer toutes les inscriptions pour cet user (id_user)
    const registrations = await pool.query(
      `SELECT r.id, r.registered_at, r.status, e.id_event, e.title, e.event_date
       FROM registrations r
       JOIN events e ON r.id_event = e.id_event
       WHERE r.id_user = $1
       ORDER BY r.registered_at DESC`,
      [id],
    );

    if (registrations.rows.length === 0) {
      return res.json([]);
    }

    res.json(registrations.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /orga/:id/event -> récupérer les inscriptions d'un organisateur à ces différents évents
exports.getRegistrationOfEventByOrga = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
          r.id AS registration_id,r.status,r.registered_at,
          e.id_event,e.title,e.event_date,
          u.id_user,u.firstname,u.lastname,u.email
      FROM registrations r
      JOIN events e ON r.id_event = e.id_event
      JOIN users u ON r.id_user = u.id_user
      WHERE e.id_orga = $1
      ORDER BY e.event_date DESC;
      `,
      [id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /:id/register -> s’inscrire à un événement
exports.registerToEvent = async (req, res) => {
  try {
    const id_event = req.params.id;
    const { id_user } = req.body;

    const eventQuery = await pool.query(
      "SELECT * FROM events WHERE id_event=$1 AND is_published=TRUE",
      [id_event],
    );

    if (!eventQuery.rows.length) {
      return res
        .status(404)
        .json({ message: "Événement non trouvé ou non publié" });
    }

    const existing = await pool.query(
      "SELECT 1 FROM registrations WHERE id_user=$1 AND id_event=$2",
      [id_user, id_event],
    );

    if (existing.rows.length) {
      return res.status(400).json({ message: "Déjà inscrit" });
    }

    const count = await pool.query(
      "SELECT COUNT(*) FROM registrations WHERE id_event=$1",
      [id_event],
    );

    if (+count.rows[0].count >= eventQuery.rows[0].max_participants) {
      return res.status(400).json({ message: "Événement complet" });
    }

    const insert = await pool.query(
      `INSERT INTO registrations (id_user, id_event)
       VALUES ($1,$2) RETURNING *`,
      [id_user, id_event],
    );

    await logUserAction(id_user, id_user, "event_registration", id_event);

    // JOIN user
    const userData = await pool.query(
      `SELECT email, firstname FROM users WHERE id_user=$1`,
      [id_user],
    );

    const user = userData.rows[0];

    await sendEmail(
      user.email,
      "Inscription en attente",
      `Inscription à ${eventQuery.rows[0].title}`,
      registerTemplate(user.firstname, eventQuery.rows[0].title),
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// PATCH /:id/status -> valider ou refuser une inscription (organisateur uniquement)
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const data = await pool.query(
      `SELECT r.id_user, r.id_event, u.email, u.firstname, e.title
       FROM registrations r
       JOIN users u ON r.id_user = u.id_user
       JOIN events e ON r.id_event = e.id_event
       WHERE r.id=$1`,
      [id],
    );

    if (!data.rows.length) {
      return res.status(404).json({ message: "Inscription non trouvée" });
    }

    const { id_user, id_event, email, firstname, title } = data.rows[0];

    const updated = await pool.query(
      "UPDATE registrations SET status=$1 WHERE id=$2 RETURNING *",
      [status, id],
    );

    await logUserAction(
      id_user,
      req.user.id,
      status === "confirmed"
        ? "user_registration_validated"
        : "event_registration_cancelled",
      id_event,
    );

    await sendEmail(
      email,
      status === "confirmed" ? "Inscription validée" : "Inscription refusée",
      `Statut mis à jour`,
      statusTemplate(firstname, title, status),
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// DELETE /:id -> annuler une inscription
exports.unregisterFromEvent = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await pool.query(
      `SELECT r.id_user, r.id_event, u.email, u.firstname, e.title
       FROM registrations r
       JOIN users u ON r.id_user = u.id_user
       JOIN events e ON r.id_event = e.id_event
       WHERE r.id=$1`,
      [id],
    );

    if (!data.rows.length) {
      return res.status(404).json({ message: "Inscription non trouvée" });
    }

    const { id_user, id_event, email, firstname, title } = data.rows[0];

    await pool.query("DELETE FROM registrations WHERE id=$1", [id]);

    await logUserAction(
      id_user,
      id_user,
      "event_registration_cancelled",
      id_event,
    );

    await sendEmail(
      email,
      "Inscription annulée",
      `Annulation`,
      cancelTemplate(firstname, title),
    );

    res.json({ message: "Annulé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
