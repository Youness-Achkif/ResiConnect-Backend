-- ResiConnect Database Schema

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('gestionnaire', 'resident')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appartements (
    id      SERIAL PRIMARY KEY,
    numero  VARCHAR(20) NOT NULL,
    etage   INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS paiements (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    montant        NUMERIC(10, 2) NOT NULL,
    date_paiement  DATE NOT NULL,
    statut         VARCHAR(20) NOT NULL CHECK (statut IN ('en_attente', 'valide', 'refuse')),
    fichier_url    TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problemes (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titre          VARCHAR(200) NOT NULL,
    description    TEXT NOT NULL,
    statut         VARCHAR(20) NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'en_cours', 'resolu')),
    priorite       VARCHAR(20) NOT NULL DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    date_creation  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL PRIMARY KEY,
    expediteur_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destinataire_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contenu         TEXT NOT NULL,
    date_envoi      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lu              BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS annonces (
    id            SERIAL PRIMARY KEY,
    auteur_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titre         VARCHAR(200) NOT NULL,
    contenu       TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
