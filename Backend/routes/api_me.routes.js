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

router.get(
  "/:id/export/pdf",
  authenticateToken,
  authorizeRoles("USER", "ORGANIZER"),
  exportMyDataPDF,
);

router.get(
  "/:id/export",
  authenticateToken,
  authorizeRoles("USER", "ORGANIZER"),
  exportMyData,
);

/**
 * @swagger
 * /api/me/{id}:
 *   get:
 *     summary: Récupère les données personnelles d'un utilisateur
 *     tags: [Me]
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
 */
router.get("/:id", authenticateToken, getMyData);

/**
 * @swagger
 * /api/me/{id}:
 *   put:
 *     summary: Met à jour les données personnelles d'un utilisateur
 *     tags: [Me]
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
 */
router.delete("/:id", authenticateToken, deleteMyData);

module.exports = router;
