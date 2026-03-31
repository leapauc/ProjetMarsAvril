CREATE EXTENSION IF NOT EXISTS pgcrypto;

---------------------------------------------------------
-- DROP TABLE - CLEAN DB
---------------------------------------------------------
DROP TABLE IF EXISTS user_action_log;
DROP TABLE IF EXISTS consent_log;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

---------------------------------------------------------
-- CREATE AND FILL TABLE USERS
---------------------------------------------------------
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    consent_date TIMESTAMP NOT NULL,
    consent_version VARCHAR(10) NOT NULL,
    is_anonymized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE(email);

INSERT INTO users 
(email, password, firstname, lastname, phone, role, consent_date, consent_version, is_anonymized)
VALUES
('lea.pauchot@gmail.com', crypt('123456789', gen_salt('bf')), 'Léa', 'PAUCHOT', '0600000001', 'ADMIN', NOW(), 'v1', FALSE),
('alice.dupont@email.com', crypt('123456789', gen_salt('bf')), 'Alice', 'Dupont', '0600000001', 'USER', NOW(), 'v1', FALSE),
('bob.martin@email.com', crypt('123456789', gen_salt('bf')), 'Bob', 'Martin', '0600000002', 'ORGANIZER', NOW(), 'v1', FALSE),
('claire.durand@email.com', crypt('123456789', gen_salt('bf')), 'Claire', 'Durand', NULL, 'USER', NOW(), 'v1', FALSE),
('david.leroy@email.com', crypt('123456789', gen_salt('bf')), 'David', 'Leroy', '0600000004', 'USER', NOW(), 'v1', FALSE),
('emma.moreau@email.com', crypt('123456789', gen_salt('bf')), 'Emma', 'Moreau', NULL, 'ORGANIZER', NOW(), 'v1', FALSE),
('francois.robert@email.com', crypt('123456789', gen_salt('bf')), 'François', 'Robert', '0600000006', 'USER', NOW(), 'v1', FALSE),
('julie.petit@email.com', crypt('123456789', gen_salt('bf')), 'Julie', 'Petit', '0600000007', 'USER', NOW(), 'v1', FALSE),
('luc.bernard@email.com', crypt('123456789', gen_salt('bf')), 'Luc', 'Bernard', NULL, 'ORGANIZER', NOW(), 'v1', FALSE),
('marie.richard@email.com', crypt('123456789', gen_salt('bf')), 'Marie', 'Richard', '0600000009', 'USER', NOW(), 'v1', FALSE),
('paul.garnier@email.com', crypt('123456789', gen_salt('bf')), 'Paul', 'Garnier', NULL, 'ORGANIZER', NOW(), 'v1', FALSE);

---------------------------------------------------------
-- CREATE AND FILL TABLE EVENTS
---------------------------------------------------------
CREATE TABLE events (
    id_event SERIAL PRIMARY KEY,
    title VARCHAR,
    description TEXT,
    event_date TIMESTAMP,
    location VARCHAR,
    max_participants INTEGER,
    id_orga INTEGER,
    is_published BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_orga) REFERENCES users(id_user) ON DELETE CASCADE
);

INSERT INTO events
(title, description, event_date, location, max_participants, id_orga, is_published, created_at)
VALUES
('Conférence Tech 2026', 'Conférence sur les nouvelles technologies', '2026-06-15 10:00:00', 'Paris', 100, 3, TRUE, NOW()),
('Atelier Symfony', 'Workshop pratique Symfony', '2026-07-01 14:00:00', 'Lyon', 20, 6, TRUE, NOW()),
('Hackathon IA', '48h de hackathon sur l’IA', '2026-08-10 09:00:00', 'Marseille', 50, 9, TRUE, NOW()),
('Meetup Dev', 'Rencontre entre développeurs', '2026-05-20 18:00:00', 'Bordeaux', 30, 11, TRUE, NOW()),
('Formation Vue.js', 'Formation frontend Vue.js', '2026-09-12 09:00:00', 'Toulouse', 25, 3, FALSE, NOW()),
('Conférence Cybersécurité', 'Sécurité informatique', '2026-10-05 10:00:00', 'Paris', 80, 6, TRUE, NOW()),
('Workshop Docker', 'Initiation Docker', '2026-06-25 13:00:00', 'Lille', 15, 9, TRUE, NOW()),
('Afterwork Tech', 'Networking IT', '2026-07-18 19:00:00', 'Nantes', 40, 11, TRUE, NOW()),
('Bootcamp Backend', 'Formation intensive backend', '2026-08-01 09:00:00', 'Paris', 20, 3, TRUE, NOW()),
('Conférence Cloud', 'Cloud computing', '2026-11-15 10:00:00', 'Nice', 60, 6, TRUE, NOW());

---------------------------------------------------------
-- CREATE AND FILL TABLE REGISTRATIONS
---------------------------------------------------------
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    id_user INTEGER,
    id_event INTEGER,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status registration_status NOT NULL DEFAULT 'pending',
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_event) REFERENCES events(id_event) ON DELETE CASCADE
);

INSERT INTO registrations
(id_user, id_event, registered_at, status)
VALUES
(2, 1, NOW(), 'confirmed'),
(4, 1, NOW(), 'pending'),
(5, 2, NOW(), 'confirmed'),
(7, 3, NOW(), 'cancelled'),
(8, 4, NOW(), 'confirmed'),
(10, 5, NOW(), 'pending'),
(2, 6, NOW(), 'confirmed'),
(4, 7, NOW(), 'confirmed'),
(5, 8, NOW(), 'pending'),
(7, 9, NOW(), 'confirmed');

---------------------------------------------------------
-- CREATE AND FILL TABLE CONSENT_LOG
---------------------------------------------------------
CREATE TYPE consent_action AS ENUM ('consent_given','consent_withdrawn','data_accessed','data_deleted');
CREATE TABLE consent_log (
    id SERIAL PRIMARY KEY,
    id_user INTEGER,
    action consent_action NOT NULL DEFAULT 'consent_withdrawn',
    datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR,
    details VARCHAR,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

INSERT INTO consent_log
(id_user, action, datetime, ipAddress, details)
VALUES
(1, 'consent_given', NOW(), crypt('192.168.0.1', gen_salt('bf')), 'Inscription admin'),
(2, 'consent_given', NOW(), crypt('192.168.0.2', gen_salt('bf')), 'Inscription utilisateur'),
(3, 'consent_given', NOW(), crypt('192.168.0.3', gen_salt('bf')), 'Inscription organisateur'),
(4, 'data_accessed', NOW(), crypt('192.168.0.4', gen_salt('bf')), 'Consultation profil'),
(5, 'data_accessed', NOW(), crypt('192.168.0.5', gen_salt('bf')), 'Modification email'),
(6, 'consent_withdrawn', NOW(), crypt('192.168.0.6', gen_salt('bf')), 'Retrait consentement'),
(7, 'data_deleted', NOW(), crypt('192.168.0.7', gen_salt('bf')), 'Anonymisation compte'),
(8, 'data_accessed', NOW(), crypt('192.168.0.8', gen_salt('bf')), 'Accès données'),
(9, 'consent_given', NOW(), crypt('192.168.0.9', gen_salt('bf')), 'Nouvelle version politique'),
(10, 'data_accessed', NOW(), crypt('192.168.0.10', gen_salt('bf')), 'Changement téléphone'),
(11, 'data_accessed', NOW(), crypt('192.168.0.11', gen_salt('bf')), 'Consultation profil');

-- Type d'action possible
CREATE TYPE action_type AS ENUM (
    'user_registered',        -- un user s'inscrit lui-même
    'user_registration_validated', -- un orga valide une inscription
    'user_data_modified',     -- modification des données personnelles
    'event_registration',     -- inscription à un événement
    'event_registration_cancelled', -- annulation inscription
    'notification_sent',       -- notification envoyée
    'event_created',
    'event_updated',
    'event_deleted',
    'data_deleted',
    'data_viewed'
);

CREATE TABLE user_action_log (
    id SERIAL PRIMARY KEY,
    id_target_user INTEGER,      
    id_actor_user INTEGER,       
    action action_type NOT NULL,
    related_event INTEGER,       
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,                
    FOREIGN KEY (id_target_user) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_actor_user) REFERENCES users(id_user) ON DELETE CASCADE,
	FOREIGN KEY (related_event) REFERENCES events(id_event) ON DELETE CASCADE
);

-- INSERTIONS DANS user_action_log (2 à 4 actions par user)
-- Utilisateur 1 : Léa (ADMIN) → 3 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, details)
VALUES
(1, 1, 'user_registered', 'Inscription par elle-même'),
(1, 1, 'user_data_modified', 'Mise à jour profil admin'),
(2, 1, 'notification_sent', 'Notification envoyée à Alice pour Conférence Tech 2026');

-- Utilisateur 2 : Alice (USER) → 3 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, related_event, details)
VALUES
(2, 2, 'user_registered', NULL, 'Inscription par elle-même'),
(2, 3, 'user_registration_validated', 1, 'Validation par Bob pour Conférence Tech 2026'),
(2, 2, 'event_registration', 1, 'Inscription confirmée à Conférence Tech 2026');

-- Utilisateur 3 : Bob (ORGANIZER) → 3 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, details)
VALUES
(3, 3, 'user_registered', 'Inscription par lui-même'),
(4, 3, 'user_registration_validated', 'Validation inscription Claire Durand'),
(3, 3, 'notification_sent', 'Notification envoyée aux participants Hackathon IA');

-- Utilisateur 4 : Claire (USER) → 2 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, related_event, details)
VALUES
(4, 4, 'user_registered', NULL, 'Inscription par elle-même'),
(4, 3, 'user_registration_validated', 1, 'Validation par Bob pour Conférence Tech 2026');

-- Utilisateur 5 : David (USER) → 3 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, related_event, details)
VALUES
(5, 5, 'user_registered', NULL, 'Inscription par lui-même'),
(5, 5, 'event_registration', 2, 'Inscription confirmée Atelier Symfony'),
(5, 5, 'user_data_modified', NULL, 'Modification email');

-- Utilisateur 6 : Emma (ORGANIZER) → 2 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, details)
VALUES
(6, 6, 'user_registered', 'Inscription par elle-même'),
(5, 6, 'user_registration_validated', 'Validation inscription David pour Atelier Symfony');

-- Utilisateur 7 : François (USER) → 3 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, related_event, details)
VALUES
(7, 7, 'user_registered', NULL, 'Inscription par lui-même'),
(7, 3, 'user_registration_validated', 3, 'Validation par Bob Hackathon IA'),
(7, 7, 'event_registration', 9, 'Inscription Bootcamp Backend');

-- Utilisateur 8 : Julie (USER) → 2 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, related_event, details)
VALUES
(8, 8, 'user_registered', NULL, 'Inscription par elle-même'),
(8, 9, 'user_registration_validated', 4, 'Validation par Luc Meetup Dev');

-- Utilisateur 9 : Luc (ORGANIZER) → 3 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, details)
VALUES
(9, 9, 'user_registered', 'Inscription par lui-même'),
(10, 9, 'user_registration_validated', 'Validation Marie pour Formation Vue.js'),
(9, 9, 'notification_sent', 'Notification envoyée pour Hackathon IA');

-- Utilisateur 10 : Marie (USER) → 3 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, related_event, details)
VALUES
(10, 10, 'user_registered', NULL, 'Inscription par elle-même'),
(10, 9, 'user_registration_validated', 5, 'Validation par Luc Formation Vue.js'),
(10, 10, 'event_registration', 5, 'Inscription confirmée Formation Vue.js');

-- Utilisateur 11 : Paul (ORGANIZER) → 2 actions
INSERT INTO user_action_log (id_target_user, id_actor_user, action, details)
VALUES
(11, 11, 'user_registered', 'Inscription par lui-même'),
(2, 11, 'user_registration_validated', 'Validation Alice pour Conférence Cybersécurité');