BEGIN;

-- ============================================================
-- DB-1 : Nouvelle table residences
-- ============================================================
CREATE TABLE IF NOT EXISTS residences (
  id              SERIAL PRIMARY KEY,
  nom             VARCHAR(255) NOT NULL,
  adresse         TEXT,
  gestionnaire_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DB-2 : Nouvelle table batiments (dépend de residences)
-- ============================================================
CREATE TABLE IF NOT EXISTS batiments (
  id           SERIAL PRIMARY KEY,
  nom          VARCHAR(100) NOT NULL,
  residence_id INTEGER NOT NULL REFERENCES residences(id) ON DELETE CASCADE
);

-- ============================================================
-- DB-3 : ALTER TABLE users
-- ============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS residence_id      INTEGER REFERENCES residences(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activation_token  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS token_expiry      TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active         BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

-- ============================================================
-- DB-4 : ALTER TABLE appartements (dépend de batiments et residences)
-- ============================================================
ALTER TABLE appartements
  ADD COLUMN IF NOT EXISTS batiment_id  INTEGER REFERENCES batiments(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS residence_id INTEGER REFERENCES residences(id) ON DELETE SET NULL;

-- ============================================================
-- DB-5 : ALTER TABLE paiements
-- ============================================================
ALTER TABLE paiements
  ADD COLUMN IF NOT EXISTS residence_id INTEGER REFERENCES residences(id) ON DELETE SET NULL;

-- ============================================================
-- DB-6 : ALTER TABLE problemes
-- ============================================================
ALTER TABLE problemes
  ADD COLUMN IF NOT EXISTS residence_id INTEGER REFERENCES residences(id) ON DELETE SET NULL;

-- ============================================================
-- DB-7 : ALTER TABLE messages
-- ============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS residence_id INTEGER REFERENCES residences(id) ON DELETE SET NULL;

-- ============================================================
-- DB-8 : ALTER TABLE annonces
-- ============================================================
ALTER TABLE annonces
  ADD COLUMN IF NOT EXISTS gestionnaire_id INTEGER REFERENCES users(id)      ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS residence_id    INTEGER REFERENCES residences(id) ON DELETE CASCADE;

-- ============================================================
-- Index de performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_residences_gestionnaire ON residences(gestionnaire_id);
CREATE INDEX IF NOT EXISTS idx_batiments_residence     ON batiments(residence_id);
CREATE INDEX IF NOT EXISTS idx_users_residence         ON users(residence_id);
CREATE INDEX IF NOT EXISTS idx_appartements_batiment   ON appartements(batiment_id);
CREATE INDEX IF NOT EXISTS idx_appartements_residence  ON appartements(residence_id);
CREATE INDEX IF NOT EXISTS idx_paiements_residence     ON paiements(residence_id);
CREATE INDEX IF NOT EXISTS idx_problemes_residence     ON problemes(residence_id);
CREATE INDEX IF NOT EXISTS idx_messages_residence      ON messages(residence_id);
CREATE INDEX IF NOT EXISTS idx_annonces_residence      ON annonces(residence_id);

COMMIT;
