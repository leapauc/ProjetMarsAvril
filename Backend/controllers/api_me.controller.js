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

// EXPORT PDF
exports.exportMyDataPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await getUserWithEvents(id);
    if (!data)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const events = data.events || [];

    await pool.query(
      `INSERT INTO consent_log (id_user, action, datetime, ipAddress, details)
       VALUES ($1,'data_accessed',NOW(),crypt($2, gen_salt('bf')),$3)`,
      [id, req.ip || "0.0.0.0", "Export PDF des données personnelles"],
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="eventflow_donnees_${id}.pdf"`,
    );
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    doc.pipe(res);

    const PW = 595.28;
    const PH = 841.89;
    const M = 48;

    const PURPLE = "#7c3aed";
    const CYAN = "#06b6d4";
    const DARK = "#1e1b4b";
    const BODY = "#374151";
    const MUTED = "#9ca3af";
    const STRIPE = "#f5f3ff";
    const WHITE = "#ffffff";
    const GREEN = "#059669";
    const ORANGE = "#d97706";
    const RED = "#dc2626";

    // ── HEADER ──────────────────────────────────────────────────
    doc.rect(0, 0, PW, 88).fill(DARK);
    doc.rect(0, 0, PW, 4).fill(PURPLE);

    // Icone éclair dessinée en polygone
    const lx = M,
      ly = 22;
    doc
      .save()
      .translate(lx, ly)
      .polygon(
        [8, 0],
        [14, 0],
        [6, 18],
        [12, 18],
        [0, 36],
        [10, 36],
        [4, 20],
        [10, 20],
      )
      .fill("#a78bfa");
    doc.restore();

    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(WHITE)
      .text("EventFlow", M + 22, 24);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#a5b4fc")
      .text("Rapport de données personnelles — RGPD Art. 20", M, 56);

    const dateStr = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text(`Généré le ${dateStr}`, 0, 60, { align: "right", width: PW - M });

    doc.rect(0, 86, PW, 2).fill(PURPLE);

    let y = 110;

    // ── HELPERS ─────────────────────────────────────────────────
    const ensurePage = () => {
      if (y > 770) {
        doc.addPage();
        y = M;
        doc.rect(0, 0, PW, 4).fill(PURPLE);
      }
    };

    const drawSection = (title, color) => {
      y += 12;
      ensurePage();
      doc.rect(M, y, PW - M * 2, 30).fillAndStroke(color + "18", color + "33");
      doc.rect(M, y, 4, 30).fill(color);
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(color)
        .text(title, M + 14, y + 9);
      y += 38;
    };

    const drawRow = (label, value, stripe = false) => {
      ensurePage();
      if (stripe) doc.rect(M, y, PW - M * 2, 22).fill(STRIPE);
      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(MUTED)
        .text(label.toUpperCase(), M + 10, y + 7);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(BODY)
        .text(String(value ?? "—"), M + 175, y + 6, {
          width: PW - M * 2 - 185,
        });
      y += 22;
    };

    const statusOf = (s) => ({
      color: s === "confirmed" ? GREEN : s === "pending" ? ORANGE : RED,
      label:
        s === "confirmed"
          ? "Confirmé"
          : s === "pending"
            ? "En attente"
            : "Annulé",
    });

    // ── SECTION IDENTITÉ ────────────────────────────────────────
    drawSection("Informations personnelles", PURPLE);
    drawRow("Identifiant", `#${data.id_user}`, false);
    drawRow("Prénom", data.firstname, true);
    drawRow("Nom", data.lastname, false);
    drawRow("Email", data.email, true);
    drawRow("Téléphone", data.phone || "Non renseigné", false);
    drawRow("Rôle", data.role, true);
    drawRow(
      "Membre depuis",
      data.created_at
        ? new Date(data.created_at).toLocaleDateString("fr-FR")
        : "—",
      false,
    );
    drawRow("Compte anonymisé", data.is_anonymized ? "Oui" : "Non", true);

    // ── SECTION CONSENTEMENT ────────────────────────────────────
    drawSection("Consentement RGPD", CYAN);
    drawRow("Version acceptée", data.consent_version, false);
    drawRow(
      "Date d'acceptation",
      data.consent_date
        ? new Date(data.consent_date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "—",
      true,
    );

    // ── SECTION ÉVÉNEMENTS ──────────────────────────────────────
    drawSection(`Événements associés (${events.length})`, GREEN);

    if (events.length === 0) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(MUTED)
        .text("Aucun événement associé à ce compte.", M + 10, y + 4);
      y += 28;
    } else {
      events.forEach((ev, i) => {
        ensurePage();
        const bg = i % 2 === 0 ? STRIPE : WHITE;
        doc.rect(M, y, PW - M * 2, 50).fill(bg);
        doc.rect(M, y, 3, 50).fill(GREEN);

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor(DARK)
          .text(ev.title, M + 12, y + 8, { width: PW - M * 2 - 110 });

        const evDate = ev.event_date
          ? new Date(ev.event_date).toLocaleDateString("fr-FR")
          : "—";
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(MUTED)
          .text(`${evDate}  •  ${ev.location || "—"}`, M + 12, y + 28);

        if (ev.status) {
          const { color, label } = statusOf(ev.status);
          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor(color)
            .text(label.toUpperCase(), PW - M - 90, y + 20, {
              width: 82,
              align: "right",
            });
        }
        y += 56;
      });
    }

    // ── FOOTER ──────────────────────────────────────────────────
    doc.rect(0, PH - 42, PW, 1).fill(PURPLE + "55");
    doc.rect(0, PH - 41, PW, 41).fill("#f8f9fa");
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(MUTED)
      .text(
        "Ce document a été généré automatiquement par EventFlow. Vos données sont protégées conformément au RGPD (Règlement UE 2016/679).",
        M,
        PH - 30,
        { align: "center", width: PW - M * 2 },
      );

    doc.end();

    await logUserAction(
      id,
      id,
      "data_exported_pdf",
      null,
      "Export PDF des données personnelles",
    );
  } catch (err) {
    console.error("❌ export PDF:", err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};
