// utils/logUserAction.js
const pool = require("../db");

/**
 * Enregistre une action dans user_action_log
 * @param {number} targetUserId - l'utilisateur concerné par l'action
 * @param {number} actorUserId - l'utilisateur qui fait l'action (peut être le même)
 * @param {string} action - type d'action ('user_registered', 'user_data_modified', ...)
 * @param {number|null} relatedEvent - id de l'événement si applicable
 * @param {string|null} details - informations complémentaires
 */
const logUserAction = async (
  targetUserId,
  actorUserId,
  action,
  relatedEvent = null,
  details = null,
) => {
  try {
    await pool.query(
      `INSERT INTO user_action_log (id_target_user, id_actor_user, action, related_event, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [targetUserId, actorUserId, action, relatedEvent, details],
    );
  } catch (err) {
    console.error("Erreur logUserAction:", err);
  }
};

module.exports = logUserAction;
