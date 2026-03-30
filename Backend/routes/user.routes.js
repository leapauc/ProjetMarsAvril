const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Gestion des utilisateurs
 */
const router = express.Router();

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Récupère tous les utilisateurs
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_user:
 *                     type: integer
 *                     example: 1
 *                   email:
 *                     type: string
 *                     example: "exemple@mail.com"
 *                   firstname:
 *                     type: string
 *                     example: "Jean"
 *                   lastname:
 *                     type: string
 *                     example: "Dupont"
 *                   phone:
 *                     type: string
 *                     example: "0601020304"
 *                   role:
 *                     type: string
 *                     example: "USER"
 *                   is_anonymized:
 *                     type: boolean
 *                     example: false
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-03-30T10:00:00Z"
 *       500:
 *         description: Erreur serveur
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Récupère un utilisateur par son ID
 *     tags: [Users]
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
 *         description: Utilisateur trouvé
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
 *                   example: "exemple@mail.com"
 *                 firstname:
 *                   type: string
 *                   example: "Jean"
 *                 lastname:
 *                   type: string
 *                   example: "Dupont"
 *                 phone:
 *                   type: string
 *                   example: "0601020304"
 *                 role:
 *                   type: string
 *                   example: "USER"
 *                 is_anonymized:
 *                   type: boolean
 *                   example: false
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-03-30T10:00:00Z"
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
router.get("/:id", getUserById);

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Crée un nouvel utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *             properties:
 *               email:
 *                 type: string
 *                 example: "nouveau@mail.com"
 *               password:
 *                 type: string
 *                 example: "motdepasse123"
 *               firstname:
 *                 type: string
 *                 example: "Jean"
 *               lastname:
 *                 type: string
 *                 example: "Dupont"
 *               phone:
 *                 type: string
 *                 example: "0601020304"
 *               role:
 *                 type: string
 *                 example: "USER"
 *               consentVersion:
 *                 type: string
 *                 example: "1.0"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur créé"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id_user:
 *                       type: integer
 *                       example: 5
 *                     email:
 *                       type: string
 *                       example: "nouveau@mail.com"
 *                     firstname:
 *                       type: string
 *                       example: "Jean"
 *                     lastname:
 *                       type: string
 *                       example: "Dupont"
 *                     role:
 *                       type: string
 *                       example: "USER"
 *       400:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post("/", createUser);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Met à jour un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "modif@mail.com"
 *               firstname:
 *                 type: string
 *                 example: "Jean"
 *               lastname:
 *                 type: string
 *                 example: "Dupont"
 *               phone:
 *                 type: string
 *                 example: "0601020304"
 *               role:
 *                 type: string
 *                 example: "ADMIN"
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", updateUser);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Anonymise un utilisateur (RGPD)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur anonymisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", deleteUser);

module.exports = router;
