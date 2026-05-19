const db = require('../db');

const STATUTS_VALIDES = ['ouvert', 'en cours', 'résolu'];
const PRIORITES_VALIDES = ['haute', 'normale', 'basse'];

const getProblemes = async (req, res) => {
  try {
    if (req.user.role === 'gestionnaire') {
      const result = await db.query(
        `SELECT p.*, u.nom AS resident_nom, u.email AS resident_email
         FROM problemes p
         JOIN users u ON u.id = p.user_id
         ORDER BY p.date_creation DESC`
      );
      return res.json(result.rows);
    }

    const result = await db.query(
      `SELECT p.*, u.nom AS resident_nom, u.email AS resident_email
       FROM problemes p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1
       ORDER BY p.date_creation DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getProblemes error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const signalerProbleme = async (req, res) => {
  if (req.user.role !== 'resident') {
    return res.status(403).json({ message: 'Accès réservé aux résidents.' });
  }

  const { titre, description } = req.body;

  if (!titre || !description) {
    return res.status(400).json({ message: 'Champs obligatoires : titre, description.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO problemes (user_id, titre, description, statut, priorite)
       VALUES ($1, $2, $3, 'ouvert', 'normale')
       RETURNING *`,
      [req.user.id, titre, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('signalerProbleme error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const modifierProbleme = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { statut, priorite } = req.body;

  if (!statut && !priorite) {
    return res.status(400).json({ message: 'Au moins un champ (statut ou priorite) est requis.' });
  }

  if (statut && !STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ message: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}.` });
  }

  if (priorite && !PRIORITES_VALIDES.includes(priorite)) {
    return res.status(400).json({ message: `Priorité invalide. Valeurs acceptées : ${PRIORITES_VALIDES.join(', ')}.` });
  }

  try {
    const current = await db.query(
      `SELECT * FROM problemes WHERE id = $1`,
      [req.params.id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Problème introuvable.' });
    }

    const nouvStatut = statut || current.rows[0].statut;
    const nouvPriorite = priorite || current.rows[0].priorite;

    const result = await db.query(
      `UPDATE problemes SET statut = $1, priorite = $2 WHERE id = $3 RETURNING *`,
      [nouvStatut, nouvPriorite, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('modifierProbleme error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const supprimerProbleme = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  try {
    const result = await db.query(
      `DELETE FROM problemes WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Problème introuvable.' });
    }

    res.json({ message: 'Problème supprimé.', id: result.rows[0].id });
  } catch (err) {
    console.error('supprimerProbleme error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getProblemes, signalerProbleme, modifierProbleme, supprimerProbleme };
