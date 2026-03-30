require("dotenv").config();
const pool = require("../db"); // instance pg Pool

// GET /event/ -> Liste des événements publiés
exports.getAllEvents = async (req, res) => {
  try {
    const eventsQuery = await pool.query(
      "SELECT * FROM events WHERE is_published = TRUE ORDER BY event_date ASC",
    );
    res.json(eventsQuery.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /event/:id -> Détail d’un événement
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const eventQuery = await pool.query(
      "SELECT * FROM events WHERE id_event = $1",
      [id],
    );
    if (eventQuery.rows.length === 0) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }
    res.json(eventQuery.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /event/ -> Créer un événement
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      event_date,
      location,
      max_participants,
      is_published,
      id_orga,
    } = req.body;

    const insertQuery = await pool.query(
      `INSERT INTO events 
      (title, description, event_date, location, max_participants, id_orga, is_published, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *`,
      [
        title,
        description,
        event_date,
        location,
        max_participants,
        id_orga,
        is_published || false,
      ],
    );

    res
      .status(201)
      .json({ message: "Événement créé", event: insertQuery.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// PUT /event/:id -> Modifier un événement
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      event_date,
      location,
      max_participants,
      is_published,
      id_orga,
    } = req.body;

    // Vérifier que l'événement existe
    const eventQuery = await pool.query(
      "SELECT * FROM events WHERE id_event = $1",
      [id],
    );
    if (eventQuery.rows.length === 0) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    // Vérifier que l'utilisateur est l'organisateur (id_orga doit matcher)
    if (id_orga && eventQuery.rows[0].id_orga !== id_orga) {
      return res
        .status(403)
        .json({ message: "Vous n’êtes pas l’organisateur de cet événement" });
    }

    const updateQuery = await pool.query(
      `UPDATE events SET title=$1, description=$2, event_date=$3, location=$4, max_participants=$5, is_published=$6
       WHERE id_event=$7 RETURNING *`,
      [
        title,
        description,
        event_date,
        location,
        max_participants,
        is_published,
        id,
      ],
    );

    res.json({ message: "Événement mis à jour", event: updateQuery.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// DELETE /event/:id -> Supprimer un événement
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_orga } = req.body;

    // Vérifier que l'événement existe
    const eventQuery = await pool.query(
      "SELECT * FROM events WHERE id_event = $1",
      [id],
    );
    if (eventQuery.rows.length === 0) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    // Vérifier que l'utilisateur est l'organisateur
    if (eventQuery.rows[0].id_orga !== id_orga) {
      return res
        .status(403)
        .json({ message: "Vous n’êtes pas l’organisateur de cet événement" });
    }

    await pool.query("DELETE FROM events WHERE id_event = $1", [id]);

    res.json({ message: "Événement supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
