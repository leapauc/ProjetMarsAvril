# 🎟️ EventFlow — Plateforme de Gestion d'Événements

> Projet intégrateur • Vue.js • Node.js • RGPD

---

## Présentation du projet

### 🛠️ Stack technique

![Vue.js](https://img.shields.io/badge/Vue.js-3-42b883?logo=vue.js)
![Node.js](https://img.shields.io/badge/Node.js-Vite-339933?logo=node.js)
![RGPD](https://img.shields.io/badge/RGPD-Conforme-red)
![API](https://img.shields.io/badge/API-REST%20+%20JWT-blueviolet)

---

### 📖 Description

**EventFlow** est une application web de gestion d'événements professionnels  
(conférences, meetups, formations).

- 👨‍💼 Les organisateurs créent et publient des événements
- 🙋 Les participants s'inscrivent
- ⚡ Architecture moderne : API Symfony + SPA Vue.js
- 🔐 Conformité **RGPD native et complète**

---

### 📊 Informations projet

| 👥 Équipe             | ⏱️ Durée | 🏆 Points   | 🎤 Soutenance | 📦 Livrables | 🔧 Git      |
| --------------------- | -------- | ----------- | ------------- | ------------ | ----------- |
| Binômes (2 étudiants) | 5 jours  | 100 + bonus | 25 min        | 5 livrables  | Obligatoire |

---

### 🚀 Fonctionnalités principales

- Création et gestion d'événements
- Inscription des utilisateurs
- Gestion des rôles (USER / ORGANIZER / ADMIN)
- Notifications email
- Sécurité JWT
- Conformité RGPD (consentement, anonymisation)

## DOCKER

Un conteneur docker est à disposition afin d'avoir un environnement tout prêt pour tester cette application.

Ce conteneur utilise un fichier .env dont un exemple de contenu est présenté dans .env.example

La commande pour lancer le conteneur est la suivante :

```
docker compose --env-file .env -f docker-compose.yml up --build
```

Si vous voulez supprimer pour relancer de zéro :

```
docker compose down
docker volume rm docker_pgdata
```

## Backend

### Prérequis

Installation à prévoir :

```
npm init -y
npm install express cors dotenv pg swagger-ui-express swagger-jsdoc jsonwebtoken pdfkit nodemailer
npm install --save-dev jest supertest
npm install nodemon --save-dev
```

## Frontend

### Prérequis

```
npm install ...
```
