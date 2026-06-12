const crypto = require('crypto');
const db = require('../db');

// B-1 : résident crée un QR code visiteur
const creerVisiteur = async (req, res) => {
  if (req.user.role !== 'resident') {
    return res.status(403).json({ error: 'Accès réservé aux résidents.' });
  }

  const { nom, type, date_validite, max_utilisations } = req.body;

  if (!nom || !date_validite) {
    return res.status(400).json({ error: 'Champs obligatoires : nom, date_validite.' });
  }

  try {
    const userResult = await db.query('SELECT residence_id FROM users WHERE id = $1', [req.user.id]);
    const residence_id = userResult.rows[0]?.residence_id;

    if (!residence_id) {
      return res.status(400).json({ error: 'Vous n\'êtes pas associé à une résidence.' });
    }

    const typesValides = ['famille', 'ami', 'livreur', 'prestataire', 'autre'];
    const typeNormalise = typesValides.includes((type || '').toLowerCase())
      ? (type || '').toLowerCase()
      : 'autre';

    const maxVal = parseInt(max_utilisations, 10);
    const maxInsert = (!isNaN(maxVal) && maxVal > 0) ? maxVal : 1;

    const token = crypto.randomBytes(32).toString('hex');

    const result = await db.query(
      `INSERT INTO visiteurs (resident_id, residence_id, nom, type, token, date_validite, max_utilisations)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, token, nom, type, date_validite, max_utilisations`,
      [req.user.id, residence_id, nom, typeNormalise, token, date_validite, maxInsert]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('creerVisiteur error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// B-2 : résident consulte ses visiteurs
const getMesVisiteurs = async (req, res) => {
  if (req.user.role !== 'resident') {
    return res.status(403).json({ error: 'Accès réservé aux résidents.' });
  }

  try {
    const result = await db.query(
      `SELECT id, nom, type, token, date_validite,
              max_utilisations,
              utilisations AS nb_utilisations,
              statut, created_at
       FROM visiteurs
       WHERE resident_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getMesVisiteurs error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// B-3 : résident annule un QR code
const annulerVisiteur = async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE visiteurs SET statut = 'annulé'
       WHERE id = $1 AND resident_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ message: 'Visiteur annulé' });
  } catch (err) {
    console.error('annulerVisiteur error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = { creerVisiteur, getMesVisiteurs, annulerVisiteur };
