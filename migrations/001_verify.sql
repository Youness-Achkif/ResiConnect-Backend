-- ============================================================
-- Vérification : nouvelles tables
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('residences', 'batiments')
ORDER BY table_name;
-- Résultat attendu : 2 lignes (batiments, residences)

-- ============================================================
-- Vérification : colonnes de residences
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'residences'
ORDER BY ordinal_position;
-- Attendu : id, nom, adresse, gestionnaire_id, created_at

-- ============================================================
-- Vérification : colonnes de batiments
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'batiments'
ORDER BY ordinal_position;
-- Attendu : id, nom, residence_id

-- ============================================================
-- Vérification : nouvelles colonnes de users
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('residence_id', 'activation_token', 'token_expiry', 'is_active')
ORDER BY column_name;
-- Attendu : 4 lignes

-- ============================================================
-- Vérification : nouvelles colonnes de appartements
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appartements'
  AND column_name IN ('batiment_id', 'residence_id')
ORDER BY column_name;
-- Attendu : 2 lignes

-- ============================================================
-- Vérification : nouvelles colonnes de paiements
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'paiements'
  AND column_name = 'residence_id';
-- Attendu : 1 ligne

-- ============================================================
-- Vérification : nouvelles colonnes de problemes
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'problemes'
  AND column_name = 'residence_id';
-- Attendu : 1 ligne

-- ============================================================
-- Vérification : nouvelles colonnes de messages
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'messages'
  AND column_name = 'residence_id';
-- Attendu : 1 ligne

-- ============================================================
-- Vérification : nouvelles colonnes de annonces
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'annonces'
  AND column_name IN ('gestionnaire_id', 'residence_id')
ORDER BY column_name;
-- Attendu : 2 lignes

-- ============================================================
-- Vérification : index créés
-- ============================================================
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_residences_gestionnaire',
    'idx_batiments_residence',
    'idx_users_residence',
    'idx_appartements_batiment',
    'idx_appartements_residence',
    'idx_paiements_residence',
    'idx_problemes_residence',
    'idx_messages_residence',
    'idx_annonces_residence'
  )
ORDER BY indexname;
-- Attendu : 9 lignes
