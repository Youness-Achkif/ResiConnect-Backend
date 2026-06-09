BEGIN;

-- A-1 : Ajout du code d'invitation sur les résidences
ALTER TABLE residences
  ADD COLUMN IF NOT EXISTS code VARCHAR(10) UNIQUE;

UPDATE residences
  SET code = 'RC-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')
  WHERE code IS NULL;

ALTER TABLE residences
  ALTER COLUMN code SET NOT NULL;

-- A-2 : Table des demandes d'adhésion
CREATE TABLE IF NOT EXISTS join_requests (
  id              SERIAL PRIMARY KEY,
  resident_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  residence_id    INTEGER REFERENCES residences(id) ON DELETE CASCADE,
  appartement_id  INTEGER REFERENCES appartements(id) ON DELETE SET NULL,
  message         TEXT,
  statut          VARCHAR(20) NOT NULL DEFAULT 'en attente'
                  CHECK (statut IN ('en attente', 'accepté', 'refusé')),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_join_requests_resident
  ON join_requests(resident_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_residence
  ON join_requests(residence_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_statut
  ON join_requests(statut);

COMMIT;
