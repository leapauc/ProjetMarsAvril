const pool = require("../db");

/**
 * Historique complet
 */
exports.getFullHistory = async (req, res) => {
  try {
    const query = `
      -- Historique consent_log
      SELECT cl.id_user AS user_id,
             u.firstname || ' ' || u.lastname AS user_name,
             cl.action::TEXT AS log_type,
             cl.datetime AS log_date,
             cl.details,
             NULL AS related_event_title,
             'consent_log' AS source
      FROM consent_log cl
      LEFT JOIN users u ON u.id_user = cl.id_user

      UNION ALL

      -- Historique user_action_log
      SELECT ual.id_target_user AS user_id,
             au.firstname || ' ' || au.lastname AS user_name,
             ual.action::TEXT AS log_type,
             ual.action_date AS log_date,
             ual.details,
             e.title AS related_event_title,
             'user_action_log' AS source
      FROM user_action_log ual
      LEFT JOIN users au ON au.id_user = ual.id_actor_user
      LEFT JOIN events e ON e.id_event = ual.related_event

      ORDER BY log_date DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ getFullHistory:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/** * Historique de l'utilisateur connecté (USER / ORGANIZER)
 */
exports.getMyHistory = async (req, res) => {
  try {
    const id = req.user.id;

    const query = `
      SELECT cl.id_user AS user_id,
             u.firstname || ' ' || u.lastname AS user_name,
             cl.action::TEXT AS log_type,
             cl.datetime AS log_date,
             cl.details,
             NULL AS related_event_title,
             'consent_log' AS source
      FROM consent_log cl
      LEFT JOIN users u ON u.id_user = cl.id_user
      WHERE cl.id_user = $1

      UNION ALL

      SELECT ual.id_target_user AS user_id,
             au.firstname || ' ' || au.lastname AS user_name,
             ual.action::TEXT AS log_type,
             ual.action_date AS log_date,
             ual.details,
             e.title AS related_event_title,
             'user_action_log' AS source
      FROM user_action_log ual
      LEFT JOIN users au ON au.id_user = ual.id_actor_user
      LEFT JOIN events e ON e.id_event = ual.related_event
      WHERE ual.id_target_user = $1 OR ual.id_actor_user = $1

      ORDER BY log_date DESC
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ getMyHistory:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/** * Historique d’un utilisateur spécifique
 */
exports.getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT cl.id_user AS user_id,
             u.firstname || ' ' || u.lastname AS user_name,
             cl.action::TEXT AS log_type,
             cl.datetime AS log_date,
             cl.details,
             NULL AS related_event_title,
             'consent_log' AS source
      FROM consent_log cl
      LEFT JOIN users u ON u.id_user = cl.id_user
      WHERE cl.id_user = $1

      UNION ALL

      SELECT ual.id_target_user AS user_id,
             au.firstname || ' ' || au.lastname AS user_name,
             ual.action::TEXT AS log_type,
             ual.action_date AS log_date,
             ual.details,
             e.title AS related_event_title,
             'user_action_log' AS source
      FROM user_action_log ual
      LEFT JOIN users au ON au.id_user = ual.id_actor_user
      LEFT JOIN events e ON e.id_event = ual.related_event
      WHERE ual.id_target_user = $1 OR ual.id_actor_user = $1

      ORDER BY log_date DESC
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun historique trouvé pour cet utilisateur" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("❌ getHistoryById:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
