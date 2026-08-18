# 🎟️ EventFlow — Plateforme de gestion d'événements

> Projet intégrateur • Vue 3 • Node.js / Express • PostgreSQL • JWT • RGPD

---

## Présentation

EventFlow est une application web de gestion d'événements professionnels, de conférences, formations ou meetups.

Le front est une SPA Vue 3 avec Vue Router et Pinia. Le back est une API REST Express connectée à PostgreSQL et documentée en OpenAPI via Swagger.

Code disponible : <https://github.com/leapauc/ProjetMarsAvril/tree/lpa>

Rem: Bien veiller à être sur la branche `lpa` du projet `ProjetMarsAvril`.


---

## Stack technique

- Frontend : Vue 3, Vite, Vue Router, Pinia, Axios
- Backend : Node.js, Express 5, PostgreSQL via `pg`
- Sécurité : JWT, hashage PostgreSQL `crypt`
- Base de données : PostgreSQL + `pg_cron`
- Documentation API : Swagger UI (`/api-docs`)
- Notifications : Nodemailer, PDFKit, QRCode
- Déploiement local : Docker Compose, Dockerfiles backend/frontend/database

---

## Fonctionnalités principales

- Création, lecture, modification et suppression d'événements
- Durée d'événement en minutes, calcul automatique de l'heure de fin
- Gestion des inscriptions et blocage des inscriptions sur les événements passés
- Tableau de bord par rôle : `USER`, `ORGANIZER`, `ADMIN`
- Vue liste / calendrier par mois du dashboard selon les permissions
- Consentement RGPD, journalisation des actions et anonymisation utilisateur
- Envoi d'emails et génération de documents PDF / QR-code côté API
- Gestion de statistiques et historique utilisateur

---

## Architecture du projet

### Backend

Le backend se trouve dans le dossier [Backend](Backend) et expose les endpoints suivants :

- `/api/auth` : inscription, connexion, JWT
- `/api/event` : CRUD événements
- `/api/registrations` : gestion des inscriptions
- `/api/me` : données personnelles et événements associés
- `/api/consent` : consentement RGPD
- `/api/history` : historique d'actions
- `/api/stats` : statistiques disponibles

Le point d'entrée de l'API est [Backend/app.js](Backend/app.js). La documentation Swagger est exposée via [Backend/swaggerOptions.js](Backend/swaggerOptions.js) sur `/api-docs`.

### Frontend

Le frontend est dans le dossier [Frontend](Frontend) et s'appuie sur les vues du dossier [Frontend/src/views](Frontend/src/views). Les routes principales sont déclarées dans [Frontend/src/router/index.js](Frontend/src/router/index.js) et les appels API passent par [Frontend/src/api/axios.js](Frontend/src/api/axios.js).

---

## Configuration locale

### Variables d'environnement

Le projet Docker attend un fichier `.env` placé dans le dossier [docker](docker) avec les variables suivantes :

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=db_password
DB_NAME=eventflow

PORT=3000

JWT_SECRET=jwt_secret_key
JWT_EXPIRES_IN=1d

EMAIL_USER=lea.pauchot@gmail.com
EMAIL_PASS=email_password

VITE_API_URL=http://localhost:3010/api
```

Un exemple complet est fourni dans [docker/.env.example](docker/.env.example).

---

## Lancement avec Docker

Depuis le dossier [docker](docker) :

```bash
docker compose up --build
```

Pour reconstruire entièrement la base PostgreSQL à zéro :

```bash
docker compose down
docker volume rm docker_pgdata
docker compose up --build
```

Les services disponibles sont :

- `postgres` : base PostgreSQL sur le port `5433`
- `api` : API Express sur le port `3010`
- `frontend` : Vue/Vite servi par Nginx sur le port `5173`

---

## Lancement manuel

### Backend

Depuis [Backend](Backend) :

```bash
npm install
npm start
```

Le backend expose les commandes du package dans [Backend/package.json](Backend/package.json) :

```json
"scripts": {
  "test": "jest",
  "start": "node server.js"
}
```

### Frontend

Depuis [Frontend](Frontend) :

```bash
npm install
npm run dev
```

Le build de production est :

```bash
npm run build
```

---

## Documentation API

L'API est documentée en Swagger UI. Une fois l'API démarrée localement, elle est disponible sur :

<http://localhost:3010/api-docs/>


---

## Tests

La suite Jest est organisée dans le dossier [Backend/tests](Backend/tests) et peut être lancée depuis le backend :

```bash
npm test
```

ou une suite ciblée :

```bash
npx jest tests/auth.test.js --runInBand
```

---

## Rôles applicatifs

- `USER` : consultation des événements, inscription, tableau de bord personnel
- `ORGANIZER` : création / gestion des événements qu'il organise
- `ADMIN` : administration globale, vue globale des événements + dashboard partagé

---

## Points techniques à connaître

- Le schéma de base initialise la table `events` avec une colonne `duration` exprimée en minutes.
- L'heure de fin d'un événement est calculée à partir de la date de début et de la durée.
- Le frontend utilise un composant de vue calendrier/list dans le dashboard, selon le rôle et la collection d'événements chargée.
- Les inscriptions sur des événements passés sont bloquées côté backend afin d'éviter l'inscription en lecture seule sur un événement déjà terminé.
