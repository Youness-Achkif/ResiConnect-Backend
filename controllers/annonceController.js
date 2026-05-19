const db = require('../db');

const getAnnonces = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, u.nom AS auteur_nom
       FROM annonces a
       JOIN users u ON u.id = a.auteur_id
       ORDER BY a.date_creation DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAnnonces error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const creerAnnonce = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  const { titre, contenu } = req.body;

  if (!titre || !contenu) {
    return res.status(400).json({ message: 'Champs obligatoires : titre, contenu.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO annonces (auteur_id, titre, contenu)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, titre, contenu]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('creerAnnonce error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const supprimerAnnonce = async (req, res) => {
  if (req.user.role !== 'gestionnaire') {
    return res.status(403).json({ message: 'Accès réservé au gestionnaire.' });
  }

  try {
    const result = await db.query(
      `DELETE FROM annonces WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Annonce introuvable.' });
    }

    res.json({ message: 'Annonce supprimée.', id: result.rows[0].id });
  } catch (err) {
    console.error('supprimerAnnonce error:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getAnnonces, creerAnnonce, supprimerAnnonce };
