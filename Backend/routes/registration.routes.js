const express = require("express");
const {
  getRegistrationById,
  registerToEvent,
  unregisterFromEvent,
} = require("../controllers/registration.controller");
/**
 * @swagger
 * tags:
 *   - name: Registrations
 *     description: Gestion des inscriptions aux événements
 */
const router = express.Router();

/**
 * @swagger
 * /registration/{id}:
 *   get:
 *     summary: Récupère toutes les inscriptions d'un utilisateur
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *         example: 1
 *     responses:
 *       200:
 *         description: Liste des inscriptions récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 10
 *                   registered_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-03-30T10:00:00Z"
 *                   status:
 *                     type: string
 *                     example: "pending"
 *                   id_event:
 *                     type: integer
 *                     example: 5
 *                   title:
 *                     type: string
 *                     example: "Conférence Node.js"
 *                   event_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-04-10T14:00:00Z"
 *       404:
 *         description: Aucune inscription trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Aucune inscription trouvée"
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", getRegistrationById);

/**
 * @swagger
 * /registration/{id}/register:
 *   post:
 *     summary: Inscrire un utilisateur à un événement
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'événement
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_user
 *             properties:
 *               id_user:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inscription réussie"
 *                 registration:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     id_user:
 *                       type: integer
 *                       example: 1
 *                     id_event:
 *                       type: integer
 *                       example: 5
 *                     registered_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-03-30T10:00:00Z"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *       400:
 *         description: Erreur lors de l'inscription (déjà inscrit ou nombre max atteint)
 *       404:
 *         description: Événement non trouvé ou non publié
 *       500:
 *         description: Erreur serveur
 */
router.post("/:id/register", registerToEvent);

/**
 * @swagger
 * /registration/{id}:
 *   delete:
 *     summary: Annule une inscription à un événement
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'inscription
 *         example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_user
 *             properties:
 *               id_user:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Inscription annulée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inscription annulée avec succès"
 *       404:
 *         description: Inscription non trouvée pour cet utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inscription non trouvée pour cet utilisateur"
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", unregisterFromEvent);

module.exports = router;
