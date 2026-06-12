const db = require('../db');

// B-6 : gestionnaire consulte l'historique d'accès de sa résidence
const getHistorique = async (req, res) => {
  const { residence_id } = req.query;

  if (!residence_id) {
    return res.status(400).json({ error: 'residence_id est obligatoire.' });
  }

  try {
    // Vérifier ownership
    const ownerCheck = await db.query(
      'SELECT id FROM residences WHERE id = $1 AND gestionnaire_id = $2',
      [residence_id, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const result = await db.query(
      `SELECT h.id, h.date_entree, h.statut, h.raison_refus,
              v.nom AS visiteur_nom, v.type,
              u.nom AS resident_nom
       FROM historique_acces h
       LEFT JOIN visiteurs v ON v.id = h.visiteur_id
       LEFT JOIN users u ON u.id = v.resident_id
       WHERE h.residence_id = $1
       ORDER BY h.date_entree DESC
       LIMIT 100`,
      [residence_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getHistorique error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = { getHistorique };
