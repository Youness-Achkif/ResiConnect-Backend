const db = require('../db');

const getAnnonces = async (req, res) => {
  try {
    if (req.user.role === 'gestionnaire') {
      const { residence_id } = req.query;
      if (!residence_id) return res.json([]);
      const result = await db.query(
        `SELECT a.*, u.nom AS auteur_nom
         FROM annonces a
         JOIN users u ON u.id = a.auteur_id
         WHERE a.residence_id = $1
         ORDER BY a.date_creation DESC`,
        [residence_id]
      );
      return res.json(result.rows);
    }

    // résident : annonces de sa propre résidence
    const result = await db.query(
      `SELECT a.* FROM annonces a
       JOIN users u ON u.residence_id = a.residence_id
       WHERE u.id = $1`,
      [req.user.id]
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

  const { titre, contenu, residence_id } = req.body;

  if (!titre || !contenu) {
    return res.status(400).json({ message: 'Champs obligatoires : titre, contenu.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO annonces (auteur_id, titre, contenu, residence_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, titre, contenu, residence_id || null]
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
