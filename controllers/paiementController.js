const db = require('../db');

const STATUTS_VALIDES = ['en attente', 'payé', 'refusé'];

const getPaiements = async (req, res) => {
  try {
    if (req.user.role === 'gestionnaire') {
      const { residence_id } = req.query;
      if (!residence_id) return res.json([]);
      const result = await db.query(
        `SELECT p.*, u.nom AS resident_nom, u.email AS resident_email
         FROM paiements p
         JOIN users u ON u.id = p.user_id
         WHERE u.residence_id = $1
         ORDER BY p.created_at DESC`,
        [residence_id]
      );
      return res.json(result.rows);
    }

    const result = await db.query(
      'SELECT * FROM paiements WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getPaiements error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const creerPaiement = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { user_id, montant, date_paiement, statut, fichier_url } = req.body;

  if (!user_id || !montant || !date_paiement || !statut) {
    return res.status(400).json({ message: 'Champs obligatoires : user_id, montant, date_paiement, statut.' });
  }

  if (!STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ message: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}.` });
  }

  if (isNaN(montant) || Number(montant) <= 0) {
    return res.status(400).json({ message: 'Le montant doit être un nombre positif.' });
  }

  try {
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const result = await db.query(
      `INSERT INTO paiements (user_id, montant, date_paiement, statut, fichier_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, montant, date_paiement, statut, fichier_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('creerPaiement error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const modifierPaiement = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { id } = req.params;
  const { statut, justificatif_url } = req.body;

  if (!statut && justificatif_url === undefined) {
    return res.status(400).json({ message: 'Au moins un champ (statut ou justificatif_url) est requis.' });
  }

  if (statut && !STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ message: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}.` });
  }

  try {
    const current = await db.query('SELECT * FROM paiements WHERE id = $1', [id]);

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Paiement introuvable.' });
    }

    const nouvStatut = statut || current.rows[0].statut;
    const nouvJustificatif = justificatif_url !== undefined ? justificatif_url : current.rows[0].justificatif_url;

    const result = await db.query(
      `UPDATE paiements SET statut = $1, justificatif_url = $2 WHERE id = $3 RETURNING *`,
      [nouvStatut, nouvJustificatif, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paiement introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('modifierPaiement error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const supprimerPaiement = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM paiements WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paiement introuvable.' });
    }

    res.json({ message: 'Paiement supprimé.', id: result.rows[0].id });
  } catch (err) {
    console.error('supprimerPaiement error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getPaiements, creerPaiement, modifierPaiement, supprimerPaiement };
