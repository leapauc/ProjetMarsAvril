require("dotenv").config();
const pool = require("../db");
const PDFDocument = require("pdfkit");
const logUserAction = require("../utils/logUserAction");

// Fonction commune (SAFE)
const getUserWithEvents = async (id) => {
  const userQuery = await pool.query(
    `SELECT id_user, email, firstname, lastname, phone, role, consent_date, consent_version, is_anonymized, created_at
     FROM users
     WHERE id_user = $1`,
    [id],
  );

  if (userQuery.rows.length === 0) return null;

  const user = userQuery.rows[0];
  let events = [];

  try {
    if (user.role === "ORGANIZER") {
      const eventQuery = await pool.query(
        `SELECT id_event, title, description, event_date, location, max_participants, is_published
         FROM events
         WHERE id_orga = $1`,
        [id],
      );
      events = eventQuery.rows || [];
    }

    if (user.role === "USER") {
      const eventQuery = await pool.query(
        `SELECT e.id_event, e.title, e.description, e.event_date, e.location, e.max_participants, r.status
         FROM registrations r
         JOIN events e ON r.id_event = e.id_event
         WHERE r.id_user = $1`,
        [id],
      );
      events = eventQuery.rows || [];
    }
  } catch (err) {
    console.error("❌ Erreur récupération events:", err);
    events = []; // fallback sécurisé
  }

  return { ...user, events };
};

// ----------------------------------------------------------
// GET /me/:id
exports.getMyData = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getUserWithEvents(id);

    if (!data) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_accessed',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Consultation des données personnelles"],
    );

    await logUserAction(
      id,
      id,
      "data_viewed",
      null,
      "Consultation des données personnelles",
    );

    res.json(data);
  } catch (err) {
    console.error("❌ getMyData:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /me/:id
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

    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_accessed',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Modification des données personnelles"],
    );

    await logUserAction(
      id,
      id,
      "data_updated",
      null,
      "Modification des données personnelles",
    );

    res.json({ message: "Données mises à jour", user: updatedUser.rows[0] });
  } catch (err) {
    console.error("❌ updateMyData:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /me/:id (RGPD)
exports.deleteMyData = async (req, res) => {
  try {
    const { id } = req.params;

    const userQuery = await pool.query("SELECT * FROM users WHERE id_user=$1", [
      id,
    ]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

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

    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_deleted',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Anonymisation du compte"],
    );

    await logUserAction(
      id,
      id,
      "data_deleted",
      null,
      "Anonymisation du compte",
    );

    res.json({ message: "Compte anonymisé avec succès" });
  } catch (err) {
    console.error("❌ deleteMyData:", err);
    res.status(500).json({ message: err.message });
  }
};

// EXPORT JSON
exports.exportMyData = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getUserWithEvents(id);

    if (!data) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_accessed',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Export JSON des données personnelles"],
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="user_${id}_data.json"`,
    );
    res.setHeader("Content-Type", "application/json");

    await logUserAction(
      id,
      id,
      "data_exported",
      null,
      "Export JSON des données personnelles",
    );

    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ export JSON:", err);
    res.status(500).json({ message: err.message });
  }
};

// EXPORT PDF (FIX FINAL)
exports.exportMyDataPDF = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("➡️ Export PDF pour user:", id);

    const data = await getUserWithEvents(id);

    if (!data) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const events = data.events || [];

    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_accessed',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Export PDF des données personnelles"],
    );

    // Headers AVANT pipe
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="user_${id}_data.pdf"`,
    );
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument();

    doc.on("error", (err) => {
      console.error("❌ PDF error:", err);
    });

    doc.pipe(res);

    // CONTENU
    doc.fontSize(20).text("Export des données personnelles", {
      align: "center",
    });
    doc.moveDown();

    doc.fontSize(14).text("Informations utilisateur", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`ID : ${data.id_user}`);
    doc.text(`Email : ${data.email}`);
    doc.text(`Nom : ${data.firstname} ${data.lastname}`);
    doc.text(`Téléphone : ${data.phone || "Non renseigné"}`);
    doc.text(`Rôle : ${data.role}`);
    doc.text(`Consentement : ${data.consent_version} (${data.consent_date})`);
    doc.text(`Compte anonymisé : ${data.is_anonymized ? "Oui" : "Non"}`);

    doc.moveDown();

    doc.fontSize(14).text("Événements", { underline: true });
    doc.moveDown(0.5);

    if (events.length === 0) {
      doc.fontSize(12).text("Aucun événement.");
    } else {
      events.forEach((event) => {
        doc
          .fontSize(12)
          .text(`• ${event.title}`)
          .text(`  Date : ${event.event_date}`)
          .text(`  Lieu : ${event.location}`);

        if (event.status) {
          doc.text(`  Statut : ${event.status}`);
        }

        doc.moveDown(0.5);
      });
    }

    doc.moveDown();
    doc.fontSize(10).text(`Export généré le : ${new Date().toLocaleString()}`, {
      align: "right",
    });

    await logUserAction(
      id,
      id,
      "data_exported_pdf",
      null,
      "Export PDF des données personnelles",
    );

    doc.end();
  } catch (err) {
    console.error("❌ export PDF:", err);
    res.status(500).json({ message: err.message });
  }
};
