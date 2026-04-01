const express = require("express");
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEventsAdmin,
} = require("../controllers/events.controller");
/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Gestion des événements
 */
const router = express.Router();
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/event:
 *   get:
 *     summary: Récupère tous les événements publiés
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Liste des événements récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_event:
 *                     type: integer
 *                     example: 1
 *                   title:
 *                     type: string
 *                     example: "Conférence Node.js"
 *                   description:
 *                     type: string
 *                     example: "Une conférence sur Node.js"
 *                   event_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-04-10T14:00:00Z"
 *                   location:
 *                     type: string
 *                     example: "Paris, France"
 *                   max_participants:
 *                     type: integer
 *                     example: 50
 *                   id_orga:
 *                     type: integer
 *                     example: 2
 *                   is_published:
 *                     type: boolean
 *                     example: true
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-03-30T10:00:00Z"
 *       500:
 *         description: Erreur serveur
 */
router.get("/", getAllEvents);
/**
 * @swagger
 * /api/event/all:
 *   get:
 *     summary: Récupère tous les événements publiés
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des événements récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_event:
 *                     type: integer
 *                     example: 1
 *                   title:
 *                     type: string
 *                     example: "Conférence Node.js"
 *                   description:
 *                     type: string
 *                     example: "Une conférence sur Node.js"
 *                   event_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-04-10T14:00:00Z"
 *                   location:
 *                     type: string
 *                     example: "Paris, France"
 *                   max_participants:
 *                     type: integer
 *                     example: 50
 *                   id_orga:
 *                     type: integer
 *                     example: 2
 *                   is_published:
 *                     type: boolean
 *                     example: true
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-03-30T10:00:00Z"
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/all",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAllEventsAdmin,
);

/**
 * @swagger
 * /api/event/{id}:
 *   get:
 *     summary: Récupère un événement par son ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'événement
 *         example: 1
 *     responses:
 *       200:
 *         description: Détails de l'événement récupérés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_event:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                   example: "Conférence Node.js"
 *                 description:
 *                   type: string
 *                   example: "Une conférence sur Node.js"
 *                 event_date:
 *                   type: string
 *                   format: date-time
 *                 location:
 *                   type: string
 *                 max_participants:
 *                   type: integer
 *                   example: 15
 *                 id_orga:
 *                   type: integer
 *                 is_published:
 *                   type: boolean
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 remaining_spots:
 *                   type: integer
 *                   example: 5
 *       404:
 *         description: Événement non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Événement non trouvé"
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", getEventById);

/**
 * @swagger
 * /api/event:
 *   post:
 *     summary: Crée un nouvel événement
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - event_date
 *               - location
 *               - max_participants
 *               - id_orga
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Conférence Node.js"
 *               description:
 *                 type: string
 *               event_date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               max_participants:
 *                 type: integer
 *               id_orga:
 *                 type: integer
 *               is_published:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Événement créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Événement créé"
 *                 event:
 *                   type: object
 *       500:
 *         description: Erreur serveur
 */
router.post("/", authenticateToken, authorizeRoles("ORGANIZER"), createEvent);

/**
 * @swagger
 * /api/event/{id}:
 *   put:
 *     summary: Met à jour un événement
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'événement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               event_date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               max_participants:
 *                 type: integer
 *               is_published:
 *                 type: boolean
 *               id_orga:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Événement mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Événement mis à jour"
 *                 event:
 *                   type: object
 *       403:
 *         description: Non autorisé (organisateur non correspondant)
 *       404:
 *         description: Événement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", authenticateToken, authorizeRoles("ORGANIZER"), updateEvent);

/**
 * @swagger
 * /api/event/{id}:
 *   delete:
 *     summary: Supprime un événement
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'événement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_orga:
 *                 type: integer
 *                 description: ID de l'organisateur
 *     responses:
 *       200:
 *         description: Événement supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Événement supprimé avec succès"
 *       403:
 *         description: Non autorisé (organisateur non correspondant)
 *       404:
 *         description: Événement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ORGANIZER", "ADMIN"),
  deleteEvent,
);

module.exports = router;
