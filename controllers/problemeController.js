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

  const { titre, description, photo_url } = req.body;

  if (!titre || !description) {
    return res.status(400).json({ message: 'Champs obligatoires : titre, description.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO problemes (user_id, titre, description, statut, priorite, photo_url)
       VALUES ($1, $2, $3, 'ouvert', 'normale', $4)
       RETURNING *`,
      [req.user.id, titre, description, photo_url || null]
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

  const { statut, priorite, photo_url } = req.body;

  if (!statut && !priorite && photo_url === undefined) {
    return res.status(400).json({ message: 'Au moins un champ (statut, priorite ou photo_url) est requis.' });
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
    const nouvPhotoUrl = photo_url !== undefined ? photo_url : current.rows[0].photo_url;

    const result = await db.query(
      `UPDATE problemes SET statut = $1, priorite = $2, photo_url = $3 WHERE id = $4 RETURNING *`,
      [nouvStatut, nouvPriorite, nouvPhotoUrl, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('modifierProbleme error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const supprimerProbleme = async (req, res) => {
  try {
    const current = await db.query('SELECT id, user_id FROM problemes WHERE id = $1', [req.params.id]);

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Problème introuvable.' });
    }

    const probleme = current.rows[0];

    if (req.user.role === 'resident' && probleme.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres problèmes.' });
    }

    if (req.user.role !== 'gestionnaire' && req.user.role !== 'resident') {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    await db.query('DELETE FROM problemes WHERE id = $1', [req.params.id]);

    res.json({ message: 'Problème supprimé.', id: probleme.id });
  } catch (err) {
    console.error('supprimerProbleme error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getProblemes, signalerProbleme, modifierProbleme, supprimerProbleme };
