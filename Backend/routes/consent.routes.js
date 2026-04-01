const express = require("express");
const { postConsent } = require("../controllers/consent.controller");
/**
 * @swagger
 * tags:
 *   - name: Consent
 *     description: Gestion du consentement des utilisateurs
 */
const router = express.Router();
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

router.use(authenticateToken, authorizeRoles("USER", "ORGANIZER"));

/**
 * @swagger
 * /api/consent:
 *   post:
 *     summary: Met à jour le consentement d'un utilisateur
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_user
 *               - consentVersion
 *             properties:
 *               id_user:
 *                 type: integer
 *                 description: ID de l'utilisateur
 *                 example: 1
 *               consentVersion:
 *                 type: string
 *                 description: Version du consentement donnée
 *                 example: "v2.1"
 *     responses:
 *       200:
 *         description: Consentement mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Consentement mis à jour avec succès"
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur non trouvé"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 */
router.post("/", postConsent);

module.exports = router;
