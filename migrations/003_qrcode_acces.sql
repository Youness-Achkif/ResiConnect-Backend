BEGIN;

-- A-1 : Table des visiteurs avec QR code
CREATE TABLE IF NOT EXISTS visiteurs (
  id               SERIAL PRIMARY KEY,
  resident_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  residence_id     INTEGER REFERENCES residences(id) ON DELETE CASCADE,
  nom              VARCHAR(255) NOT NULL,
  type             VARCHAR(20) NOT NULL DEFAULT 'autre'
                   CHECK (type IN ('famille','ami','livreur','prestataire','autre')),
  token            VARCHAR(64) UNIQUE NOT NULL,
  date_validite    TIMESTAMP NOT NULL,
  max_utilisations INTEGER NOT NULL DEFAULT 1,
  utilisations     INTEGER NOT NULL DEFAULT 0,
  statut           VARCHAR(20) NOT NULL DEFAULT 'actif'
                   CHECK (statut IN ('actif','annulé')),
  created_at       TIMESTAMP DEFAULT NOW()
);

-- A-2 : Table de l'historique des accès
CREATE TABLE IF NOT EXISTS historique_acces (
  id            SERIAL PRIMARY KEY,
  visiteur_id   INTEGER REFERENCES visiteurs(id) ON DELETE SET NULL,
  residence_id  INTEGER REFERENCES residences(id) ON DELETE CASCADE,
  date_entree   TIMESTAMP DEFAULT NOW(),
  statut        VARCHAR(20) NOT NULL
                CHECK (statut IN ('autorisé','refusé')),
  raison_refus  TEXT
);

-- A-3 : PIN gardien sur les résidences
ALTER TABLE residences
  ADD COLUMN IF NOT EXISTS pin_gardien VARCHAR(6);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_visiteurs_token      ON visiteurs(token);
CREATE INDEX IF NOT EXISTS idx_visiteurs_resident   ON visiteurs(resident_id);
CREATE INDEX IF NOT EXISTS idx_visiteurs_residence  ON visiteurs(residence_id);
CREATE INDEX IF NOT EXISTS idx_historique_residence ON historique_acces(residence_id);

COMMIT;
