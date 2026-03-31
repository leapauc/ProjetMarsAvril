const express = require("express");
const {
  getFullHistory,
  getHistoryById,
} = require("../controllers/history.controller");
/**
 * @swagger
 * tags:
 *   - name: History
 *     description: Récupération de l'historique des actions et consentements des utilisateurs
 */
const router = express.Router();
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

router.use(authenticateToken, authorizeRoles("ADMIN", "USER", "ORGANIZER"));

/**
 * @swagger
 * /history:
 *   get:
 *     summary: Récupère l'historique complet
 *     tags: [History]
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                     example: 2
 *                   user_name:
 *                     type: string
 *                     example: "Bob Martin"
 *                   log_type:
 *                     type: string
 *                     example: "user_registration_validated"
 *                   log_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-03-31T10:22:04.883Z"
 *                   details:
 *                     type: string
 *                     example: "Validation par Bob pour Conférence Tech 2026"
 *                   related_event_title:
 *                     type: string
 *                     nullable: true
 *                     example: "Conférence Tech 2026"
 *                   source:
 *                     type: string
 *                     example: "user_action_log"
 *       500:
 *         description: Erreur serveur
 */
router.get("/", getFullHistory);

/**
 * @swagger
 * /history/{id}:
 *   get:
 *     summary: Récupère l'historique d'un utilisateur spécifique
 *     tags: [History]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Historique de l'utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                     example: 2
 *                   user_name:
 *                     type: string
 *                     example: "Alice Dupont"
 *                   log_type:
 *                     type: string
 *                     example: "event_registration"
 *                   log_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-03-31T10:22:04.883Z"
 *                   details:
 *                     type: string
 *                     example: "Inscription confirmée à Conférence Tech 2026"
 *                   related_event_title:
 *                     type: string
 *                     nullable: true
 *                     example: "Conférence Tech 2026"
 *                   source:
 *                     type: string
 *                     example: "user_action_log"
 *       404:
 *         description: Aucun historique trouvé pour cet utilisateur
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", getHistoryById);

module.exports = router;
