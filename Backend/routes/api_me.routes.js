const express = require("express");
const {
  getMyData,
  updateMyData,
  deleteMyData,
  exportMyData,
  exportMyDataPDF,
} = require("../controllers/api_me.controller");
/**
 * @swagger
 * tags:
 *   - name: Me
 *     description: Gestion des données personnelles d'un utilisateur (RGPD)
 */
const router = express.Router();
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/me/{id}/export/pdf:
 *   get:
 *     summary: Export PDF des données personnelles d'un utilisateur
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur dont on exporte les données
 *     responses:
 *       200:
 *         description: Export PDF généré avec succès
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/:id/export/pdf",
  authenticateToken,
  authorizeRoles("USER", "ORGANIZER", "ADMIN"),
  exportMyDataPDF,
);

/**
 * @swagger
 * /api/me/{id}/export:
 *   get:
 *     summary: Export JSON des données personnelles d'un utilisateur
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur dont on exporte les données
 *     responses:
 *       200:
 *         description: Export JSON généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id_user: 2
 *                 email: "alice.dupont@email.com"
 *                 firstname: "Alice"
 *                 lastname: "Dupont"
 *                 phone: "0600000001"
 *                 role: "USER"
 *                 consent_date: "2026-03-31T10:22:04.883Z"
 *                 consent_version: "v1"
 *                 is_anonymized: false
 *                 events:
 *                   - id_event: 1
 *                     title: "Conférence Tech 2026"
 *                     description: "Conférence sur les nouvelles technologies"
 *                     event_date: "2026-06-15T10:00:00Z"
 *                     location: "Paris"
 *                     max_participants: 100
 *                     status: "confirmed"
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/:id/export",
  authenticateToken,
  authorizeRoles("USER", "ORGANIZER", "ADMIN"),
  exportMyData,
);

/**
 * @swagger
 * /api/me/{id}:
 *   get:
 *     summary: Récupère les données personnelles d'un utilisateur
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de l'utilisateur
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Données récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_user:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 firstname:
 *                   type: string
 *                   example: "John"
 *                 lastname:
 *                   type: string
 *                   example: "Doe"
 *                 phone:
 *                   type: string
 *                   example: "0601020304"
 *                 role:
 *                   type: string
 *                   example: "USER"
 *                 consent_date:
 *                   type: string
 *                   format: date-time
 *                 consent_version:
 *                   type: string
 *                   example: "v2.1"
 *                 is_anonymized:
 *                   type: boolean
 *                   example: false
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", authenticateToken, getMyData);

/**
 * @swagger
 * /api/me/{id}:
 *   put:
 *     summary: Met à jour les données personnelles d'un utilisateur
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de l'utilisateur
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               firstname:
 *                 type: string
 *                 example: "John"
 *               lastname:
 *                 type: string
 *                 example: "Doe"
 *               phone:
 *                 type: string
 *                 example: "0601020304"
 *     responses:
 *       200:
 *         description: Données mises à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Données mises à jour"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id_user:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     firstname:
 *                       type: string
 *                       example: "John"
 *                     lastname:
 *                       type: string
 *                       example: "Doe"
 *                     phone:
 *                       type: string
 *                       example: "0601020304"
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", authenticateToken, updateMyData);

/**
 * @swagger
 * /api/me/{id}:
 *   delete:
 *     summary: Anonymise les données personnelles d'un utilisateur (RGPD)
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de l'utilisateur
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Utilisateur anonymisé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Compte anonymisé avec succès"
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", authenticateToken, deleteMyData);

module.exports = router;
